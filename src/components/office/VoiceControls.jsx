
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
    const trimmedRoom = roomInput.trim();

    if (trimmedRoom) {
      joinRoom(trimmedRoom);
    }
  };

  const statusColor = isJoined
    ? connectionState === "connected"
      ? "#4ade80"
      : "#facc15"
    : "#9ca3af";

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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
        }}
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: statusColor,
            display: "inline-block",
          }}
        />
        <span>
          {isJoined
            ? `Room: ${roomId} · ${connectionState}`
            : "Not connected"}
        </span>
      </div>

      <label htmlFor="voice-room">Room ID</label>

      <input
        id="voice-room"
        value={roomInput}
        onChange={(event) => setRoomInput(event.target.value)}
        placeholder="Enter the same room ID on both devices"
        disabled={isJoined}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #4b5563",
        }}
      />

      <button
        onClick={handleJoin}
        disabled={isJoined || !roomInput.trim()}
      >
        {isJoined ? `Joined: ${roomId}` : "Join Voice Room"}
      </button>

      <p style={{ margin: 0 }}>
        Microphone: {isMicOn ? (isMuted ? "Muted 🔇" : "On 🎙️") : "Off"}
      </p>

      <button onClick={startMicrophone} disabled={isMicOn}>
        {isMicOn ? "Microphone Enabled" : "Enable Microphone"}
      </button>

      <button
        onClick={toggleMicrophone}
        disabled={!isMicOn || !isJoined}
      >
        {isMuted ? "Unmute Mic" : "Mute Mic"}
      </button>

      <button onClick={stopMicrophone} disabled={!isJoined && !isMicOn}>
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
