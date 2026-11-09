import { AVERAGE_SPEED_KMH } from '../config';

const toRadians = (degree) => (degree * Math.PI) / 180;

// Great-circle distance between two points in kilometres (Haversine formula).
export const calculateDistance = (fromLat, fromLng, toLat, toLng) => {
  const R = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Travel time in minutes at the average city speed.
export const calculateTime = (distanceKm) => (distanceKm / AVERAGE_SPEED_KMH) * 60;

export const formatTime = (minutes) => {
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} hr${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
  }
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr` : ''}`;
};

export const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`);

export const formatLocation = (lat, lng) =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;

// Parses "lat, lng" text into numbers, or returns null.
export const parseLatLng = (text) => {
  const parts = String(text || '').split(',').map((part) => parseFloat(part.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

export const formatLatLng = ({ lat, lng }) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
