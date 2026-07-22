import { Platform } from 'react-native';
import { getActiveServerBaseUrl } from '../services/api';

export const formatImageUrl = (url, fallback = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900') => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const cleanUrl = url.trim();

  // If it's an uploaded image path (e.g. /uploads/... or http://.../uploads/...)
  if (cleanUrl.includes('/uploads/')) {
    const relativePath = cleanUrl.substring(cleanUrl.indexOf('/uploads/'));
    const baseUrl = getActiveServerBaseUrl();
    return `${baseUrl}${relativePath}`;
  }

  // If it's an un-uploaded local file:// URL stored before upload feature was added
  if (cleanUrl.startsWith('file://')) {
    return fallback;
  }

  return cleanUrl;
};

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

export const ensureArray = (val, fallback = []) => {
  if (Array.isArray(val) && val.length > 0) return val;
  if (Array.isArray(val) && val.length === 0) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (trimmed.includes(',')) {
      const split = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
    return [trimmed];
  }
  if (val && typeof val === 'object') {
    try {
      const vals = Object.values(val).filter(v => typeof v === 'string' && v.trim().length > 0);
      if (vals.length > 0) return vals;
    } catch (e) {}
  }
  return fallback;
};

