import { avatarColor, initials } from '../utils/avatar';

// Renders the "who's here" avatar stack (call this in the header) and the
// floating cursor dots+labels for everyone else currently on the board
// (call this once, absolutely positioned over the whole page).

export function PresenceStack({ users, myUsername }) {
  if (users.length === 0) return null;

  const shown = users.slice(0, 5);
  const overflow = users.length - shown.length;

  return (
    <div className="presence-stack">
      {shown.map((u) => (
        <span
          key={u.socketId}
          className="presence-avatar"
          title={u.username === myUsername ? `${u.username} (you)` : u.username}
          style={{ background: avatarColor(u.username) }}
        >
          {initials(u.username)}
        </span>
      ))}
      {overflow > 0 && <span className="presence-avatar presence-overflow">+{overflow}</span>}
    </div>
  );
}

export function CursorLayer({ cursors }) {
  return (
    <div className="cursor-layer">
      {Object.entries(cursors).map(([socketId, c]) => (
        <div
          key={socketId}
          className="remote-cursor"
          style={{
            left: `${c.xPct * 100}vw`,
            top: `${c.yPct * 100}vh`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={avatarColor(c.username)}>
            <path d="M4 2l14 6.5-6 1.7L9.5 16z" />
          </svg>
          <span className="remote-cursor-label" style={{ background: avatarColor(c.username) }}>
            {c.username}
          </span>
        </div>
      ))}
    </div>
  );
}
