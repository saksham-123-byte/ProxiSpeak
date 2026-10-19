
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 700;
const PLAYER_SPEED = 240;

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
  drawRoundedRect(ctx, x - 12, y + 12, 24, 22, 5, '#a16207');
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
    ctx.ellipse(x + dx, y + dy, 7, 13, dx / 20, 0, Math.PI * 2);
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
    isYou ? '#7c3aed' : '#ffffff',
  );

  ctx.fillStyle = isYou ? '#ffffff' : '#334155';
  ctx.font = '600 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 38);

  ctx.restore();
}

function drawWorld(ctx, player, teammates, zoom = 1) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = '#f5f3ff';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.save();
  ctx.translate(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-WORLD_WIDTH / 2, -WORLD_HEIGHT / 2);

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

  ctx.beginPath();
  ctx.arc(player.x, player.y, 125, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(139, 92, 246, 0.07)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  teammates.forEach((person) => {
    drawAvatar(
      ctx,
      person.x,
      person.y,
      person.name || 'Teammate',
      person.color || '#38bdf8',
    );
  });

  drawAvatar(ctx, player.x, player.y, 'You', '#8b5cf6', true);

  drawRoundedRect(ctx, 430, 625, 340, 28, 14, '#ffffff');

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Move with WASD or arrow keys', 600, 643);

  ctx.restore();
}

export default function OfficeCanvas({ teammates = [], onPositionChange }) {
  const canvasRef = useRef(null);
  const playerRef = useRef({ x: 300, y: 300 });
  const keysRef = useRef({});
  const zoomRef = useRef(1);
  const socketRef = useRef(null);
  const remotePlayersRef = useRef({});
  const teammatesRef = useRef(teammates);
  const onPositionChangeRef = useRef(onPositionChange);

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    teammatesRef.current = Array.isArray(teammates) ? teammates : [];
  }, [teammates]);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!socketUrl) {
      console.warn('VITE_SOCKET_URL is not configured; multiplayer disabled.');
      return undefined;
    }

    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to ProxiSpeak backend:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('Disconnected from ProxiSpeak backend:', reason);
    });

    socket.on('player:moved', ({ socketId, location } = {}) => {
      if (
        !socketId ||
        typeof location?.x !== 'number' ||
        typeof location?.y !== 'number'
      ) {
        return;
      }

      remotePlayersRef.current[socketId] = {
        id: socketId,
        name: `Player ${socketId.slice(0, 4)}`,
        x: location.x,
        y: location.y,
        color: '#38bdf8',
      };
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      remotePlayersRef.current = {};
    };
  }, []);

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

  function changeZoom(amount) {
    const nextZoom = Math.min(
      1.5,
      Math.max(0.75, Math.round((zoomRef.current + amount) * 100) / 100),
    );

    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }

  function resetZoom() {
    zoomRef.current = 1;
    setZoom(1);
  }

  function startTouchMove(direction, event) {
    event.preventDefault();
    keysRef.current[direction] = true;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may not be available in every browser.
    }
  }

  function stopTouchMove(direction) {
    keysRef.current[direction] = false;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationId;
    let previousTime = 0;
    let lastUiUpdate = 0;

    const animate = (time) => {
      if (previousTime === 0) previousTime = time;

      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.w || keys.arrowup) dy -= 1;
      if (keys.s || keys.arrowdown) dy += 1;
      if (keys.a || keys.arrowleft) dx -= 1;
      if (keys.d || keys.arrowright) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }

      const position = playerRef.current;

      position.x = Math.max(
        25,
        Math.min(WORLD_WIDTH - 25, position.x + dx * PLAYER_SPEED * delta),
      );

      position.y = Math.max(
        25,
        Math.min(WORLD_HEIGHT - 25, position.y + dy * PLAYER_SPEED * delta),
      );

      const remotePlayers = Object.values(remotePlayersRef.current);

      const visibleTeammates = [
        ...teammatesRef.current.filter(
          (person) => !person.id?.startsWith('socket-'),
        ),
        ...remotePlayers.map((person) => ({
          ...person,
          id: `socket-${person.id}`,
        })),
      ];

      drawWorld(ctx, position, visibleTeammates, zoomRef.current);

      if (time - lastUiUpdate >= 100) {
        const currentPosition = {
          x: Math.round(position.x),
          y: Math.round(position.y),
        };

        onPositionChangeRef.current?.(currentPosition);

        if (socketRef.current?.connected) {
          socketRef.current.emit('player:move', currentPosition);
        }

        lastUiUpdate = time;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="office-canvas"
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        aria-label="Virtual office. Use WASD or arrow keys to move."
      />

      <div className="zoom-controls" aria-label="Office zoom controls">
        <button
          type="button"
          onClick={() => changeZoom(0.1)}
          disabled={zoom >= 1.5}
          aria-label="Zoom in"
        >
          +
        </button>

        <span>{Math.round(zoom * 100)}%</span>

        <button
          type="button"
          onClick={() => changeZoom(-0.1)}
          disabled={zoom <= 0.75}
          aria-label="Zoom out"
        >
          −
        </button>

        <button
          type="button"
          onClick={resetZoom}
          disabled={zoom === 1}
        >
          Reset
        </button>
      </div>

      <div className="touch-controls" aria-label="Touch movement controls">
        <button
          type="button"
          className="touch-button touch-up"
          aria-label="Move up"
          onPointerDown={(event) => startTouchMove('w', event)}
          onPointerUp={() => stopTouchMove('w')}
          onPointerCancel={() => stopTouchMove('w')}
          onLostPointerCapture={() => stopTouchMove('w')}
        >
          ▲
        </button>

        <button
          type="button"
          className="touch-button touch-left"
          aria-label="Move left"
          onPointerDown={(event) => startTouchMove('a', event)}
          onPointerUp={() => stopTouchMove('a')}
          onPointerCancel={() => stopTouchMove('a')}
          onLostPointerCapture={() => stopTouchMove('a')}
        >
          ◀
        </button>

        <button
          type="button"
          className="touch-button touch-down"
          aria-label="Move down"
          onPointerDown={(event) => startTouchMove('s', event)}
          onPointerUp={() => stopTouchMove('s')}
          onPointerCancel={() => stopTouchMove('s')}
          onLostPointerCapture={() => stopTouchMove('s')}
        >
          ▼
        </button>

        <button
          type="button"
          className="touch-button touch-right"
          aria-label="Move right"
          onPointerDown={(event) => startTouchMove('d', event)}
          onPointerUp={() => stopTouchMove('d')}
          onPointerCancel={() => stopTouchMove('d')}
          onLostPointerCapture={() => stopTouchMove('d')}
        >
          ▶
        </button>
      </div>
    </>
  );
}
