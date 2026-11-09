const express = require('express');
const axios = require('axios');
const { query } = require('express-validator');
const fetchUser = require('../middleware/fetchUser');
const validate = require('../middleware/validate');

const router = express.Router();
const GOOGLE_API = 'https://maps.googleapis.com/maps/api';

const latLng = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be a number between -90 and 90'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be a number between -180 and 180'),
];

// All proxy routes need a logged-in user so the server key cannot be used as an open proxy.
router.use(fetchUser);
router.use((req, res, next) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(503).json({ message: 'GOOGLE_MAPS_API_KEY is not configured on the server.' });
  }
  next();
});

const google = (path, params) =>
  axios.get(`${GOOGLE_API}/${path}`, {
    params: { ...params, key: process.env.GOOGLE_MAPS_API_KEY },
    timeout: 10000,
  });

// Nearby places
router.get('/places', latLng, validate, async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const response = await google('place/nearbysearch/json', { location: `${lat},${lng}`, radius: 10 });
    res.json(response.data);
  } catch (error) {
    console.error('Google Nearby Search API error:', error.message);
    res.status(502).json({ message: 'Failed to fetch places data' });
  }
});

// Place details
router.get(
  '/place-details',
  query('placeId').matches(/^[A-Za-z0-9_-]{1,512}$/).withMessage('Invalid placeId'),
  validate,
  async (req, res) => {
    try {
      const response = await google('place/details/json', { place_id: req.query.placeId });
      res.json(response.data);
    } catch (error) {
      console.error('Google Place Details API error:', error.message);
      res.status(502).json({ message: 'Failed to fetch place details' });
    }
  }
);

// Reverse geocode: returns { postalCode, town }
router.get('/geocode', latLng, validate, async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const response = await google('geocode/json', { latlng: `${lat},${lng}` });
    const results = response.data.results || [];

    if (response.data.status !== 'OK' || results.length === 0) {
      return res.status(404).json({ message: 'No address found for the given coordinates.' });
    }

    const components = results[0].address_components || [];
    const find = (type) => components.find((c) => c.types.includes(type))?.long_name || null;

    res.json({ postalCode: find('postal_code'), town: find('locality') });
  } catch (error) {
    console.error('Geocoding API error:', error.message);
    res.status(502).json({ message: 'Failed to reverse geocode the location.' });
  }
});

module.exports = router;
