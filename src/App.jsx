
import { useEffect, useState } from 'react';
import OfficeCanvas from './components/office/OfficeCanvas.jsx';
import VoiceControls from './components/office/VoiceControls.jsx';
import useWebRTC from './hooks/useWebRTC.js';
import './App.css';

const PROXIMITY_RADIUS = 180;

const TEAMMATES = [
  { id: 'alex', name: 'Alex', x: 650, y: 260, color: '#38bdf8' },
  { id: 'sam', name: 'Sam', x: 850, y: 470, color: '#fb923c' },
  { id: 'maya', name: 'Maya', x: 970, y: 470, color: '#4ade80' },
];

const MAX_AUDIO_DISTANCE = 600;

function App() {
  const [player, setPlayer] = useState({ x: 300, y: 300 });
  const [activeTab, setActiveTab] = useState('Office');

  const {
    isMicOn,
    isMuted,
    error,
    connectionState,
    startMicrophone,
    toggleMicrophone,
    stopMicrophone,
    updateAudioDistance,
  } = useWebRTC();

  function handlePositionChange(position) {
    setPlayer(position);
  }

  const teammatesWithDistance = TEAMMATES.map((person) => ({
    ...person,
    distance: Math.hypot(
      person.x - player.x,
      person.y - player.y
    ),
  }));

  const nearbyPeople = teammatesWithDistance.filter(
    (person) => person.distance < PROXIMITY_RADIUS
  );

  const nearestPerson = teammatesWithDistance.reduce(
    (nearest, person) =>
      person.distance < nearest.distance ? person : nearest,
    { distance: Infinity }
  );

  useEffect(() => {
    const distance = Number.isFinite(nearestPerson.distance)
      ? Math.min(nearestPerson.distance, MAX_AUDIO_DISTANCE)
      : MAX_AUDIO_DISTANCE;

    updateAudioDistance(distance);
  }, [nearestPerson.distance, updateAudioDistance]);

  async function inviteTeam() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert('Office link copied!');
    } catch {
      window.alert(
        'Copy the office URL from your browser address bar to share it.'
      );
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">P</div>
          <span>ProxiSpeak</span>
          <span className="beta-tag">BETA</span>
        </div>

        <div className="topbar-right">
          <span className="online-indicator" />
          <span className="online-label">Your virtual office</span>

          <button className="invite-button" onClick={inviteTeam}>
            + Invite team
          </button>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="workspace-label">WORKSPACE</div>

          <button
            className={`nav-item ${activeTab === 'Office' ? 'selected' : ''}`}
            onClick={() => setActiveTab('Office')}
          >
            <span>▦</span>
            Virtual office
          </button>

          <button
            className={`nav-item ${activeTab === 'People' ? 'selected' : ''}`}
            onClick={() => setActiveTab('People')}
          >
            <span>♧</span>
            People
            <span className="nav-count">4</span>
          </button>

          <div className="sidebar-divider" />

          <div className="workspace-label">YOUR TEAM</div>

          <div className="person-row">
            <span className="person-dot purple" />
            <span>You</span>
            <span className="you-tag">YOU</span>
          </div>

          {TEAMMATES.map((person) => (
            <div className="person-row" key={person.id}>
              <span
                className="person-dot"
                style={{ backgroundColor: person.color }}
              />
              <span>{person.name}</span>
            </div>
          ))}

          <div className="sidebar-bottom">
            <div className="avatar-small">P</div>
            <div>
              <strong>ProxiSpeak</strong>
              <span className="muted-text">Team workspace</span>
            </div>
          </div>
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR DIGITAL WORKSPACE</div>

              <h1>
                {activeTab === 'People' ? 'Team members' : 'Virtual office'}
              </h1>

              <p>
                {activeTab === 'People'
                  ? 'Your teammates in the virtual office.'
                  : 'Move around, meet nearby, and collaborate naturally.'}
              </p>
            </div>

            <div className="live-pill">
              <span />
              LIVE DEMO
            </div>
          </div>

          {activeTab === 'People' ? (
            <div className="people-grid">
              {[{ id: 'you', name: 'You', color: '#8b5cf6' }, ...TEAMMATES].map(
                (person) => (
                  <div className="person-card" key={person.id}>
                    <div
                      className="person-card-avatar"
                      style={{ background: person.color }}
                    >
                      {person.name[0]}
                    </div>

                    <strong>{person.name}</strong>
                    <span>Virtual office member</span>
                  </div>
                )
              )}
            </div>
          ) : (
            <>
              <section className="office-card">
                <div className="office-toolbar">
                  <div className="office-title">
                    <span className="toolbar-dot" />
                    Main office
                    <span className="toolbar-divider">/</span>
                    <span className="muted-text">Open space</span>
                  </div>

                  <div className="coordinates">
                    X: {Math.round(player.x)} &nbsp; Y: {Math.round(player.y)}
                  </div>
                </div>

                <div className="canvas-wrap">
                  <OfficeCanvas
                    teammates={TEAMMATES}
                    onPositionChange={handlePositionChange}
                  />
                </div>

                <div className="office-footer">
                  <span>Navigate your workspace</span>
                  <span>WASD / Arrow keys</span>
                </div>
              </section>

              <div className="bottom-grid">
                <section className="info-card">
                  <div className="card-heading">
                    <div>
                      <h2>People nearby</h2>
                      <p>Teammates within your proximity radius</p>
                    </div>

                    <span className="count-badge">
                      {nearbyPeople.length}
                    </span>
                  </div>

                  {nearbyPeople.length === 0 ? (
                    <div className="empty-state">
                      No teammates nearby. Move around to meet someone.
                    </div>
                  ) : (
                    nearbyPeople.map((person) => (
                      <div className="nearby-person" key={person.id}>
                        <span
                          className="person-dot"
                          style={{ backgroundColor: person.color }}
                        />

                        <div className="nearby-name">
                          <strong>{person.name}</strong>
                          <span>In your vicinity</span>
                        </div>

                        <span className="distance-tag">
                          {Math.round(person.distance)} px
                        </span>
                      </div>
                    ))
                  )}
                </section>

                <section className="info-card audio-card">
                  <div className="card-heading">
                    <div>
                      <h2>Spatial audio</h2>
                      <p>WebRTC voice controls</p>
                    </div>

                    <span className="audio-icon">♫</span>
                  </div>

                  <div className="audio-status">
                    <span
                      className="status-dot"
                      style={{
                        backgroundColor: !isMicOn
                          ? '#ef4444'
                          : isMuted
                            ? '#f59e0b'
                            : '#22c55e',
                      }}
                    />

                    <div>
                      <strong>
                        {!isMicOn
                          ? 'Microphone off'
                          : isMuted
                            ? 'Microphone muted'
                            : 'Microphone active'}
                      </strong>

                      <span>
                        {!isMicOn
                          ? 'Enable your microphone to get started'
                          : isMuted
                            ? 'Microphone audio is muted'
                            : 'Microphone is enabled'}
                      </span>
                    </div>
                  </div>

                  {connectionState !== 'disconnected' && (
                    <p>Voice connection: {connectionState}</p>
                  )}

                  {error && <p role="alert">{error}</p>}

                  {!isMicOn ? (
                    <button className="mute-button" onClick={startMicrophone}>
                      Enable microphone
                    </button>
                  ) : (
                    <>
                      <button
                        className={`mute-button ${!isMuted ? 'unmuted' : ''}`}
                        onClick={toggleMicrophone}
                      >
                        {isMuted ? 'Unmute microphone' : 'Mute microphone'}
                      </button>

                      <button
                        className="mute-button"
                        style={{ marginTop: '8px' }}
                        onClick={stopMicrophone}
                      >
                        End microphone / Call
                      </button>
                    </>
                  )}

                  <p className="demo-note">
                    Use the Team Voice panel below to join a shared voice room.
                  </p>
                </section>

                <section className="info-card">
                  <div className="card-heading">
                    <div>
                      <h2>Join Team Voice</h2>
                      <p>Enter the same room ID as your teammate.</p>
                    </div>
                  </div>

                  <VoiceControls />
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
