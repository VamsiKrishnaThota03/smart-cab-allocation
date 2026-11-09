import axios from 'axios';
import { API_URL } from '../config';
import { authHeaders } from './auth';

const TRIP_KEY = 'smart-cab-trip';

// The booked trip is kept in sessionStorage so the My Trip page survives a reload.
export const saveTrip = (trip) => sessionStorage.setItem(TRIP_KEY, JSON.stringify(trip));

export const loadTrip = () => {
  try {
    return JSON.parse(sessionStorage.getItem(TRIP_KEY)) || null;
  } catch {
    return null;
  }
};

export const clearTrip = () => sessionStorage.removeItem(TRIP_KEY);

// The cab the logged-in rider has booked on the server, or null.
export const fetchActiveCab = async () => {
  const { data } = await axios.get(`${API_URL}/api/cabs/myCab`, { headers: authHeaders() });
  if (!data?.cab) return null;
  return {
    id: data.cab._id,
    name: data.cab.name,
    phone: data.cab.phone,
    lat: parseFloat(data.cab.latitude),
    lng: parseFloat(data.cab.longitude),
  };
};

const geocodeCache = new Map();

// Reverse geocodes through the backend proxy. Resolves to { town, pincode } or null.
export const reverseGeocode = async (lat, lng) => {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    const { data } = await axios.get(`${API_URL}/api/geocode`, {
      params: { lat, lng },
      headers: authHeaders(),
    });
    const result = { town: data.town || null, pincode: data.postalCode || null };
    geocodeCache.set(key, result);
    return result;
  } catch {
    return null;
  }
};
