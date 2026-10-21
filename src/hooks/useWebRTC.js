
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL = "http://localhost:3001";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

function normalizeSdp(sdp) {
  if (typeof sdp !== "string" || !sdp.trim()) {
    throw new Error("SDP empty hai.");
  }

  return sdp
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0)
    .join("\r\n") + "\r\n";
}

export default function useWebRTC() {
  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const socketRef = useRef(null);
  const roomRef = useRef("");
  const initiatorRef = useRef(false);
  const offerStartedRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState("");
  const [localSdp, setLocalSdp] = useState("");
  const [connectionState, setConnectionState] = useState("new");
  const [isJoined, setIsJoined] = useState(false);
  const [roomId, setRoomId] = useState("");

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
        "Microphone API unavailable hai. localhost ya HTTPS par app kholo."
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
      setError("");
      await ensureMicrophone();
    } catch (err) {
      setError(err.message || "Microphone start nahi hua.");
    }
  }, [ensureMicrophone]);

  const toggleMicrophone = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];

    if (!track) {
      setError("Pehle Start Voice click karo.");
      return;
    }

    track.enabled = !track.enabled;
    setIsMicOn(true);
    setIsMuted(!track.enabled);
    setError("");
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
    }

    pendingCandidatesRef.current = [];

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    pc.ontrack = async (event) => {
      const audio = remoteAudioRef.current;

      if (audio && event.streams[0]) {
        audio.srcObject = event.streams[0];

        try {
          await audio.play();
          setError("");
        } catch {
          setError(
            "Remote audio autoplay block hua. Audio player par Play click karo."
          );
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (
        event.candidate &&
        socketRef.current?.connected &&
        roomRef.current
      ) {
        socketRef.current.emit("webrtc-ice-candidate", {
          roomId: roomRef.current,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);

      if (pc.connectionState === "failed") {
        setError(
          "WebRTC connection fail hua. Kuch networks par TURN server zaroori hota hai."
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        setError("ICE fail hua. Network ya TURN configuration check karo.");
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

  const flushPendingCandidates = useCallback(async (pc) => {
    const candidates = pendingCandidatesRef.current.splice(0);

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("Queued ICE candidate error:", err);
      }
    }
  }, []);

  const createOffer = useCallback(async () => {
    try {
      setError("");
      setLocalSdp("");

      const stream = await ensureMicrophone();
      const pc = createPeerConnection();

      addLocalTracks(pc, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("Offer SDP generate nahi hua.");

      setLocalSdp(sdp);

      if (socketRef.current?.connected && roomRef.current) {
        socketRef.current.emit("webrtc-offer", {
          roomId: roomRef.current,
          offer: pc.localDescription,
        });
      }

      return sdp;
    } catch (err) {
      setError(err.message || "Offer create nahi hua.");
      return null;
    }
  }, [ensureMicrophone, createPeerConnection, addLocalTracks]);

  const acceptOffer = useCallback(async (offerInput) => {
    try {
      setError("");

      const stream = await ensureMicrophone();
      const pc = createPeerConnection();

      addLocalTracks(pc, stream);

      const offer =
        typeof offerInput === "string"
          ? { type: "offer", sdp: normalizeSdp(offerInput) }
          : offerInput;

      await pc.setRemoteDescription(offer);
      await flushPendingCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("Answer SDP generate nahi hua.");

      setLocalSdp(sdp);

      if (socketRef.current?.connected && roomRef.current) {
        socketRef.current.emit("webrtc-answer", {
          roomId: roomRef.current,
          answer: pc.localDescription,
        });
      }

      return sdp;
    } catch (err) {
      setError(err.message || "Offer accept nahi hua.");
      return null;
    }
  }, [
    ensureMicrophone,
    createPeerConnection,
    addLocalTracks,
    flushPendingCandidates,
  ]);

  const acceptAnswer = useCallback(async (answerInput) => {
    try {
      setError("");

      const pc = peerRef.current;

      if (!pc || pc.signalingState !== "have-local-offer") {
        throw new Error("Pehle isi tab mein Offer create karo.");
      }

      const answer =
        typeof answerInput === "string"
          ? { type: "answer", sdp: normalizeSdp(answerInput) }
          : answerInput;

      await pc.setRemoteDescription(answer);
      await flushPendingCandidates(pc);
    } catch (err) {
      setError(err.message || "Answer accept nahi hua.");
    }
  }, [flushPendingCandidates]);

  const joinRoom = useCallback(async (requestedRoomId) => {
    const room = requestedRoomId.trim();

    if (!room) {
      setError("Room ID enter karo.");
      return;
    }

    if (socketRef.current || roomRef.current) {
      setError("Pehle current voice session End Voice se band karo.");
      return;
    }

    try {
      setError("");
      await ensureMicrophone();

      const socket = io(SIGNALING_URL, {
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;
      roomRef.current = room;
      setRoomId(room);
      offerStartedRef.current = false;

      socket.on("connect", () => {
        socket.emit("join-room", room);
      });

      socket.on("connect_error", (err) => {
        setError(`Signaling server connect nahi hua: ${err.message}`);
      });

      socket.on("room-joined", (data) => {
        initiatorRef.current = data.isInitiator;
        setIsJoined(true);
        setRoomId(data.roomId);
        setError("");
      });

      socket.on("room-full", () => {
        setError("Room full hai. Abhi sirf 2 users allowed hain.");
        socket.disconnect();
        socketRef.current = null;
        roomRef.current = "";
        setIsJoined(false);
      });

      socket.on("peer-joined", async () => {
        if (!initiatorRef.current || offerStartedRef.current) return;

        offerStartedRef.current = true;
        const result = await createOffer();

        if (!result) {
          offerStartedRef.current = false;
        }
      });

      socket.on("webrtc-offer", async (data) => {
        if (data.from === socket.id) return;
        await acceptOffer(data.offer);
      });

      socket.on("webrtc-answer", async (data) => {
        if (data.from === socket.id) return;
        await acceptAnswer(data.answer);
      });

      socket.on("webrtc-ice-candidate", async (data) => {
        if (data.from === socket.id || !data.candidate) return;

        const pc = peerRef.current;

        if (!pc || !pc.remoteDescription) {
          pendingCandidatesRef.current.push(data.candidate);
          return;
        }

        try {
          await pc.addIceCandidate(data.candidate);
        } catch (err) {
          console.error("ICE candidate error:", err);
        }
      });
    } catch (err) {
      setError(err.message || "Room join nahi hua.");
    }
  }, [ensureMicrophone, createOffer, acceptOffer, acceptAnswer]);

  const stopMicrophone = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    roomRef.current = "";
    initiatorRef.current = false;
    offerStartedRef.current = false;
    pendingCandidatesRef.current = [];

    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
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
    setLocalSdp("");
    setConnectionState("new");
    setIsJoined(false);
    setRoomId("");
    setError("");
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    isMicOn,
    isMuted,
    error,
    localSdp,
    connectionState,
    remoteAudioRef,
    isJoined,
    roomId,
    startMicrophone,
    toggleMicrophone,
    stopMicrophone,
    createOffer,
    acceptOffer,
    acceptAnswer,
    joinRoom,
  };
}
