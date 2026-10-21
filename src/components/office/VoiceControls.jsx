
import { useState } from "react";
import useWebRTC from "../../hooks/useWebRTC";

export default function VoiceControls() {
  const [roomInput, setRoomInput] = useState("proxispeak-room");

  const {
    isMicOn,
    isMuted,
    error,
    connectionState,
    isJoined,
    roomId,
    remoteAudioRef,
    startMicrophone,
    toggleMicrophone,
    stopMicrophone,
    joinRoom,
  } = useWebRTC();

  const handleJoin = () => {
    joinRoom(roomInput);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        borderRadius: "12px",
        background: "#1f2937",
        color: "white",
        maxWidth: "340px",
      }}
    >
      <h3 style={{ margin: 0 }}>ProxiSpeak Voice</h3>

      <label htmlFor="voice-room">Room ID</label>

      <input
        id="voice-room"
        value={roomInput}
        onChange={(event) => setRoomInput(event.target.value)}
        placeholder="Enter same room ID on both devices"
        disabled={isJoined}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #4b5563",
        }}
      />

      <button onClick={handleJoin} disabled={isJoined}>
        {isJoined ? `Joined: ${roomId}` : "Join Voice Room"}
      </button>

      <p style={{ margin: 0 }}>
        Microphone: {isMicOn ? (isMuted ? "Muted 🔇" : "On 🎙️") : "Off"}
      </p>

      <p style={{ margin: 0 }}>
        Connection: {connectionState}
      </p>

      <button onClick={startMicrophone}>
        Enable Microphone
      </button>

      <button onClick={toggleMicrophone}>
        {isMuted ? "Unmute Mic" : "Mute Mic"}
      </button>

      <button onClick={stopMicrophone}>
        End Voice / Leave Room
      </button>

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        controls
        style={{ width: "100%" }}
      />

      {error && (
        <p role="alert" style={{ color: "#fca5a5", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
