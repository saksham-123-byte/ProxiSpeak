
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SIGNALING_URL = 'http://localhost:3001';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
];

const MIN_AUDIO_GAIN = 0.15;
const MAX_AUDIO_GAIN = 1;
const MAX_AUDIO_DISTANCE = 600;

function calculateAudioGain(distance) {
  const normalizedDistance = Math.min(
    Math.max(distance, 0) / MAX_AUDIO_DISTANCE,
    1
  );

  return (
    MAX_AUDIO_GAIN -
    normalizedDistance * (MAX_AUDIO_GAIN - MIN_AUDIO_GAIN)
  );
}

function normalizeSdp(description) {
  return description;
}

function getDistance(positionA, positionB) {
  return Math.hypot(
    positionB.x - positionA.x,
    positionB.y - positionA.y
  );
}

export default function useWebRTC() {
  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const socketRef = useRef(null);
  const roomRef = useRef(null);
  const initiatorRef = useRef(false);
  const offerStartedRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [localSdp, setLocalSdp] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isJoined, setIsJoined] = useState(false);
  const [roomId, setRoomId] = useState('');

  const updateAudioDistance = useCallback((distance) => {
    const gainNode = gainNodeRef.current;
    const audioContext = audioContextRef.current;

    if (!gainNode || !audioContext) return;

    const targetGain = calculateAudioGain(distance);

    gainNode.gain.setTargetAtTime(
      targetGain,
      audioContext.currentTime,
      0.05
    );
  }, []);

  const setupRemoteAudio = useCallback(async (stream) => {
    remoteStreamRef.current = stream;

    try {
      let audioContext = audioContextRef.current;

      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContext();
        audioContextRef.current = audioContext;
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }

      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      audioSourceRef.current = source;
      gainNodeRef.current = gainNode;

      // Initial distance until actual player positions are connected.
      updateAudioDistance(0);

      // Audio is routed through Web Audio API, so don't also play the
      // same stream through the HTML audio element.
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }
    } catch (err) {
      console.error('Web Audio setup failed:', err);
      setError('Could not initialize spatial audio. Check browser audio permissions.');
    }
  }, [updateAudioDistance]);

  const cleanupAudio = useCallback(async () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    remoteStreamRef.current = null;

    if (audioContextRef.current) {
      const context = audioContextRef.current;
      audioContextRef.current = null;

      if (context.state !== 'closed') {
        await context.close().catch(() => {});
      }
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const ensureMicrophone = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    streamRef.current = stream;
    setIsMicOn(true);
    setIsMuted(false);

    return stream;
  }, []);

  const createPeerConnection = useCallback(async () => {
    if (peerRef.current) {
      return peerRef.current;
    }

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    peerRef.current = pc;

    const localStream = await ensureMicrophone();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      const stream = event.streams?.[0];

      if (stream) {
        void setupRemoteAudio(stream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && roomRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          roomId: roomRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);

      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        setError(
          pc.connectionState === 'failed'
            ? 'Voice connection failed. Try reconnecting.'
            : ''
        );
      }
    };

    return pc;
  }, [ensureMicrophone, setupRemoteAudio]);

  const createOffer = useCallback(async () => {
    if (offerStartedRef.current) return;

    offerStartedRef.current = true;

    try {
      const pc = await createPeerConnection();
      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      const description = normalizeSdp(pc.localDescription);
      setLocalSdp(description);

      socketRef.current?.emit('webrtc-offer', {
        roomId: roomRef.current,
        offer: description,
      });
    } catch (err) {
      offerStartedRef.current = false;
      setError(err.message || 'Could not create voice offer.');
    }
  }, [createPeerConnection]);

  const acceptOffer = useCallback(async (offer) => {
    try {
      const pc = await createPeerConnection();

      await pc.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate).catch(() => {});
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const description = normalizeSdp(pc.localDescription);
      setLocalSdp(description);

      socketRef.current?.emit('webrtc-answer', {
        roomId: roomRef.current,
        answer: description,
      });
    } catch (err) {
      setError(err.message || 'Could not accept voice offer.');
    }
  }, [createPeerConnection]);

  const acceptAnswer = useCallback(async (answer) => {
    const pc = peerRef.current;

    if (!pc || pc.signalingState === 'stable') return;

    try {
      await pc.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate).catch(() => {});
      }
      pendingCandidatesRef.current = [];
    } catch (err) {
      setError(err.message || 'Could not accept voice answer.');
    }
  }, []);

  const joinRoom = useCallback(async (requestedRoomId) => {
    const cleanedRoomId = String(requestedRoomId || '').trim();

    if (!cleanedRoomId) {
      setError('Enter a room ID first.');
      return;
    }

    try {
      setError('');

      await ensureMicrophone();

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io(SIGNALING_URL);
      socketRef.current = socket;
      roomRef.current = cleanedRoomId;
      setRoomId(cleanedRoomId);

      socket.on('connect', () => {
        socket.emit('join-room', cleanedRoomId);
      });

      socket.on('room-joined', () => {
        setIsJoined(true);
      });

      socket.on('room-full', () => {
        setError('This voice room is full.');
      });

      socket.on('peer-joined', () => {
        initiatorRef.current = true;
        void createOffer();
      });

      socket.on('webrtc-offer', (payload) => {
        void acceptOffer(payload.offer || payload);
      });

      socket.on('webrtc-answer', (payload) => {
        void acceptAnswer(payload.answer || payload);
      });

      socket.on('webrtc-ice-candidate', async (payload) => {
        const candidate = payload.candidate || payload;
        const pc = peerRef.current;

        if (pc?.remoteDescription) {
          await pc.addIceCandidate(candidate).catch(() => {});
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      });

      socket.on('connect_error', () => {
        setError('Could not connect to the voice server at localhost:3001.');
      });

      socket.on('disconnect', () => {
        setIsJoined(false);
      });
    } catch (err) {
      setError(err.message || 'Could not join the voice room.');
    }
  }, [acceptAnswer, acceptOffer, createOffer, ensureMicrophone]);

  const startMicrophone = useCallback(async () => {
    try {
      setError('');
      await ensureMicrophone();
    } catch (err) {
      setError(err.message || 'Could not access the microphone.');
    }
  }, [ensureMicrophone]);

  const toggleMicrophone = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const nextMuted = !isMuted;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
  }, [isMuted]);

  const stopMicrophone = useCallback(async () => {
    socketRef.current?.disconnect();
    socketRef.current = null;

    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    await cleanupAudio();

    roomRef.current = null;
    initiatorRef.current = false;
    offerStartedRef.current = false;
    pendingCandidatesRef.current = [];

    setIsMicOn(false);
    setIsMuted(false);
    setIsJoined(false);
    setRoomId('');
    setLocalSdp(null);
    setConnectionState('disconnected');
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();

      streamRef.current?.getTracks().forEach((track) => track.stop());

      void cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isMicOn,
    isMuted,
    error,
    localSdp,
    connectionState,
    isJoined,
    roomId,
    remoteAudioRef,
    startMicrophone,
    toggleMicrophone,
    stopMicrophone,
    joinRoom,
    updateAudioDistance,
    calculateAudioGain,
  };
}
