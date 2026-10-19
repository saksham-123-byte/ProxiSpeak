
import useWebRTC from "../hooks/useWebRTC";

export default function VoiceControls() {
  const {
    isMicOn,
    error,
    startMicrophone,
    toggleMicrophone,
    stopMicrophone,
  } = useWebRTC();

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
        maxWidth: "320px",
      }}
    >
      <h3 style={{ margin: 0 }}>Voice Chat</h3>

      <p style={{ margin: 0 }}>
        Microphone: {isMicOn ? "On 🎙️" : "Off 🔇"}
      </p>

      <button onClick={startMicrophone}>
        Start Voice
      </button>

      <button onClick={toggleMicrophone}>
        {isMicOn ? "Mute Mic" : "Unmute Mic"}
      </button>

      <button onClick={stopMicrophone}>
        End Voice
      </button>

      {error && (
        <p role="alert" style={{ color: "#fca5a5" }}>
          {error}
        </p>
      )}
    </div>
  );
}
