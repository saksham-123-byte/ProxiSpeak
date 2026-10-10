import { useEffect, useRef, useState } from 'react';
import './App.css';

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 700;
const PLAYER_SPEED = 240;
const PROXIMITY_RADIUS = 180;

const TEAMMATES = [
  { id: 'alex', name: 'Alex', x: 650, y: 260, color: '#38bdf8' },
  { id: 'sam', name: 'Sam', x: 850, y: 470, color: '#fb923c' },
  { id: 'maya', name: 'Maya', x: 970, y: 470, color: '#4ade80' },
];

function drawRoundedRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function drawDesk(ctx, x, y, label) {
  drawRoundedRect(ctx, x, y, 105, 62, 10, '#d8d3e8');
  drawRoundedRect(ctx, x + 8, y + 8, 89, 35, 6, '#f8fafc');
  drawRoundedRect(ctx, x + 34, y + 47, 38, 7, 3, '#a5a0bc');

  ctx.fillStyle = '#575569';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 52, y + 82);
}

function drawPlant(ctx, x, y) {
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.roundRect(x - 12, y + 12, 24, 22, 5);
  ctx.fill();

  ctx.fillStyle = '#22c55e';

  const leaves = [
    [-8, 5],
    [8, 1],
    [0, -9],
    [13, -7],
    [-14, -6],
  ];

  leaves.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.ellipse(
      x + dx,
      y + dy,
      7,
      13,
      dx / 20,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

function drawAvatar(ctx, x, y, name, color, isYou = false) {
  ctx.save();

  ctx.fillStyle = isYou
    ? 'rgba(139, 92, 246, 0.15)'
    : 'rgba(15, 23, 42, 0.08)';

  ctx.beginPath();
  ctx.ellipse(x, y + 8, 31, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 8, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 6, y - 10, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 3, 6, 0.15, Math.PI - 0.15);
  ctx.stroke();

  const labelWidth = Math.max(58, name.length * 7 + 20);

  drawRoundedRect(
    ctx,
    x - labelWidth / 2,
    y + 22,
    labelWidth,
    25,
    12,
    isYou ? '#7c3aed' : '#ffffff'
  );

  ctx.fillStyle = isYou ? '#ffffff' : '#334155';
  ctx.font = '600 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 38);

  ctx.restore();
}

function drawWorld(ctx, player) {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = '#f5f3ff';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Floor grid
  ctx.strokeStyle = '#e9e5f5';
  ctx.lineWidth = 1;

  for (let x = 0; x <= WORLD_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y <= WORLD_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
    ctx.stroke();
  }

  // Office zones
  drawRoundedRect(ctx, 40, 40, 450, 250, 22, '#ede9fe');
  drawRoundedRect(ctx, 520, 40, 640, 250, 22, '#dbeafe');
  drawRoundedRect(ctx, 40, 340, 1120, 320, 22, '#dcfce7');

  ctx.textAlign = 'left';
  ctx.font = '600 16px sans-serif';

  ctx.fillStyle = '#6d28d9';
  ctx.fillText('FOCUS ZONE', 60, 70);

  ctx.fillStyle = '#1d4ed8';
  ctx.fillText('COLLABORATION LOUNGE', 540, 70);

  ctx.fillStyle = '#15803d';
  ctx.fillText('TEAM SPACE', 60, 370);

  // Office furniture
  drawDesk(ctx, 90, 110, 'Workspace 01');
  drawDesk(ctx, 260, 110, 'Workspace 02');
  drawDesk(ctx, 570, 110, 'Meeting desk');
  drawDesk(ctx, 740, 110, 'Workspace 03');
  drawDesk(ctx, 90, 420, 'Workspace 04');
  drawDesk(ctx, 260, 420, 'Workspace 05');
  drawDesk(ctx, 570, 520, 'Workspace 06');
  drawDesk(ctx, 740, 520, 'Workspace 07');

  drawPlant(ctx, 450, 170);
  drawPlant(ctx, 1090, 180);
  drawPlant(ctx, 460, 560);
  drawPlant(ctx, 1090, 560);

  // Player proximity radius
  ctx.beginPath();
  ctx.arc(player.x, player.y, 125, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(139, 92, 246, 0.07)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  TEAMMATES.forEach((person) => {
    drawAvatar(
      ctx,
      person.x,
      person.y,
      person.name,
      person.color
    );
  });

  drawAvatar(ctx, player.x, player.y, 'You', '#8b5cf6', true);

  drawRoundedRect(ctx, 430, 625, 340, 28, 14, '#ffffff');

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Move with WASD or arrow keys', 600, 643);
}

function App() {
  const canvasRef = useRef(null);
  const playerRef = useRef({ x: 300, y: 300 });
  const keysRef = useRef({});

  const [player, setPlayer] = useState({ x: 300, y: 300 });
  const [muted, setMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('Office');

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)
      ) {
        event.preventDefault();
      }

      keysRef.current[key] = true;
    };

    const handleKeyUp = (event) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    const handleBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');

    if (!ctx) return undefined;

    let animationId;
    let previousTime = 0;
    let lastUiUpdate = 0;

    const animate = (time) => {
      if (previousTime === 0) {
        previousTime = time;
      }

      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.w || keys.arrowup) dy -= 1;
      if (keys.s || keys.arrowdown) dy += 1;
      if (keys.a || keys.arrowleft) dx -= 1;
      if (keys.d || keys.arrowright) dx += 1;

      // Keep diagonal movement at the same speed.
      if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }

      const position = playerRef.current;

      position.x = Math.max(
        25,
        Math.min(
          WORLD_WIDTH - 25,
          position.x + dx * PLAYER_SPEED * delta
        )
      );

      position.y = Math.max(
        25,
        Math.min(
          WORLD_HEIGHT - 25,
          position.y + dy * PLAYER_SPEED * delta
        )
      );

      drawWorld(ctx, position);

      // React state updates are throttled, while Canvas stays smooth.
      if (time - lastUiUpdate >= 100) {
        setPlayer({
          x: Math.round(position.x),
          y: Math.round(position.y),
        });

        lastUiUpdate = time;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const nearbyPeople = TEAMMATES.filter((person) => {
    const distance = Math.hypot(
      person.x - player.x,
      person.y - player.y
    );

    return distance < PROXIMITY_RADIUS;
  });

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
            className={`nav-item ${
              activeTab === 'Office' ? 'selected' : ''
            }`}
            onClick={() => setActiveTab('Office')}
          >
            <span>▦</span>
            Virtual office
          </button>

          <button
            className={`nav-item ${
              activeTab === 'People' ? 'selected' : ''
            }`}
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
              {[
                { id: 'you', name: 'You', color: '#8b5cf6' },
                ...TEAMMATES,
              ].map((person) => (
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
              ))}
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
                    X: {player.x} &nbsp; Y: {player.y}
                  </div>
                </div>

                <div className="canvas-wrap">
                  <canvas
                    ref={canvasRef}
                    width={WORLD_WIDTH}
                    height={WORLD_HEIGHT}
                    aria-label="Virtual office. Use WASD or arrow keys to move."
                  />
                </div>

                <div className="office-footer">
                  <span>⌖ Navigate your workspace</span>
                  <span>WASD / ↑ ↓ ← →</span>
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
                          {Math.round(
                            Math.hypot(
                              person.x - player.x,
                              person.y - player.y
                            )
                          )}{' '}
                          px
                        </span>
                      </div>
                    ))
                  )}
                </section>

                <section className="info-card audio-card">
                  <div className="card-heading">
                    <div>
                      <h2>Spatial audio</h2>
                      <p>Voice proximity controls</p>
                    </div>

                    <span className="audio-icon">♫</span>
                  </div>

                  <div className="audio-status">
                    <span className="status-dot" />

                    <div>
                      <strong>
                        {muted ? 'Microphone muted' : 'Mic unmuted'}
                      </strong>

                      <span>
                        {muted
                          ? 'Audio is currently off'
                          : 'Demo control only — audio is not connected'}
                      </span>
                    </div>
                  </div>

                  <button
                    className={`mute-button ${
                      muted ? '' : 'unmuted'
                    }`}
                    onClick={() => setMuted((current) => !current)}
                  >
                    {muted ? 'Unmute demo' : 'Mute demo'}
                  </button>

                  <p className="demo-note">
                    Audio controls are visual placeholders in this demo.
                  </p>
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
