
import { useCallback, useEffect, useRef, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
];

function normalizeSdp(sdp) {
  if (typeof sdp !== 'string' || !sdp.trim()) {
    throw new Error('SDP empty hai. Pehle Offer ya Answer generate karo.');
  }

  // Normalize line endings only. Do not trim or rewrite SDP lines.
  return sdp
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\r\n') + '\r\n';
}

function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      pc.removeEventListener('icegatheringstatechange', checkState);
      resolve();
    };

    const checkState = () => {
      if (pc.iceGatheringState === 'complete') {
        finish();
      }
    };

    const timeout = setTimeout(finish, 15000);

    pc.addEventListener('icegatheringstatechange', checkState);
    checkState();
  });
}

export default function useWebRTC() {
  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [localSdp, setLocalSdp] = useState('');
  const [connectionState, setConnectionState] = useState('new');

  const ensureMicrophone = useCallback(async () => {
    if (streamRef.current?.getAudioTracks().length) {
      const track = streamRef.current.getAudioTracks()[0];
      track.enabled = true;
      setIsMicOn(true);
      setIsMuted(false);
      return streamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Microphone API unavailable hai. localhost ya HTTPS par app kholo.'
      );
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

  const startMicrophone = useCallback(async () => {
    try {
      setError('');
      await ensureMicrophone();
    } catch (err) {
      setError(err.message || 'Microphone start nahi hua.');
    }
  }, [ensureMicrophone]);

  const toggleMicrophone = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];

    if (!track) {
      setError('Pehle Enable Microphone click karo.');
      return;
    }

    track.enabled = !track.enabled;
    setIsMicOn(true);
    setIsMuted(!track.enabled);
    setError('');
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    pc.ontrack = async (event) => {
      const audio = remoteAudioRef.current;

      if (audio && event.streams[0]) {
        audio.srcObject = event.streams[0];

        try {
          await audio.play();
        } catch {
          setError(
            'Remote audio ke liye audio player par Play click karo.'
          );
        }
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);

      if (pc.connectionState === 'failed') {
        setError(
          'WebRTC connection fail hua. Network ya NAT traversal issue ho sakta hai.'
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        setError(
          'ICE connection fail hua. Kuch networks par TURN server zaroori hota hai.'
        );
      }
    };

    peerRef.current = pc;
    return pc;
  }, []);

  const addLocalTracks = useCallback((pc, stream) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }, []);

  const createOffer = useCallback(async () => {
    try {
      setError('');
      setLocalSdp('');

      const stream = await ensureMicrophone();
      const pc = createPeerConnection();

      addLocalTracks(pc, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGatheringComplete(pc);

      const sdp = pc.localDescription?.sdp;

      if (!sdp) {
        throw new Error('Offer SDP generate nahi hua.');
      }

      setLocalSdp(sdp);
      return sdp;
    } catch (err) {
      setError(err.message || 'Offer create nahi hua.');
      return null;
    }
  }, [ensureMicrophone, createPeerConnection, addLocalTracks]);

  const acceptOffer = useCallback(async (offerSdp) => {
    try {
      setError('');
      setLocalSdp('');

      const stream = await ensureMicrophone();
      const pc = createPeerConnection();

      addLocalTracks(pc, stream);

      const cleanOffer = normalizeSdp(offerSdp);

      await pc.setRemoteDescription({
        type: 'offer',
        sdp: cleanOffer,
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGatheringComplete(pc);

      const sdp = pc.localDescription?.sdp;

      if (!sdp) {
        throw new Error('Answer SDP generate nahi hua.');
      }

      setLocalSdp(sdp);
      return sdp;
    } catch (err) {
      setError(err.message || 'Offer accept nahi hua.');
      return null;
    }
  }, [ensureMicrophone, createPeerConnection, addLocalTracks]);

  const acceptAnswer = useCallback(async (answerSdp) => {
    try {
      setError('');

      const pc = peerRef.current;

      if (!pc) {
        throw new Error(
          'Pehle isi tab mein Create Offer click karo.'
        );
      }

      if (pc.signalingState !== 'have-local-offer') {
        throw new Error(
          `Answer abhi accept nahi ho sakta. Signaling state: ${pc.signalingState}`
        );
      }

      const cleanAnswer = normalizeSdp(answerSdp);

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: cleanAnswer,
      });
    } catch (err) {
      setError(err.message || 'Answer accept nahi hua.');
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    setIsMicOn(false);
    setIsMuted(false);
    setLocalSdp('');
    setConnectionState('new');
    setError('');
  }, []);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.close();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isMicOn,
    isMuted,
    error,
    localSdp,
    connectionState,
    remoteAudioRef,
    startMicrophone,
    toggleMicrophone,
    stopMicrophone,
    createOffer,
    acceptOffer,
    acceptAnswer,
  };
}
