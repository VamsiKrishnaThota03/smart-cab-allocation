// Runtime configuration. Set these in a .env file (see .env.example) or in the
// hosting provider's environment settings.
const DEFAULT_API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://smart-cab-allocation-backend.onrender.com'
    : 'http://localhost:5001';

export const API_URL = (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

// Browser key for the Maps JavaScript API. Restrict it to your domains in the
// Google Cloud console; it is visible to anyone who loads the site.
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Average city driving speed used for ETA estimates.
export const AVERAGE_SPEED_KMH = 30;

// Cabs closer than this (or in the same town / pincode) count as "nearest".
export const NEAREST_RADIUS_KM = 5;
