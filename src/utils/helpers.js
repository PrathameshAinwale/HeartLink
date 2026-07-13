// src/utils/helpers.js
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km}km away`;
};

export const formatTime = (date) => {
  const now = new Date();
  const d   = new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
};

export const compatibilityColor = (pct) => {
  if (pct >= 85) return '#30D158';
  if (pct >= 70) return '#FFD60A';
  return '#FF375F';
};
