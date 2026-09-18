export const AVATAR_COLORS = ['#de350b', '#0052cc', '#00875a', '#6554c0', '#ff8b00', '#00a3bf'];

export function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name = '') {
  return name.slice(0, 2).toUpperCase();
}
