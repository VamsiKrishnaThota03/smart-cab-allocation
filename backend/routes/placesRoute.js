const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();
const GOOGLE_PLACES_API_KEY = process.env.api;// Replace with your actual API key

// Route to get nearby places
router.get('/places', async (req, res) => {
  const { lat, lng } = req.query;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10&key=${GOOGLE_PLACES_API_KEY}`
    );
    res.json(response.data); // Send the nearby search data back to the frontend
  } catch (error) {
    console.error('Google Nearby Search API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch places data' });
  }
});

// Route to get place details (to get postal code)
router.get('/place-details', async (req, res) => {
  const { placeId } = req.query;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}`
    );
    res.json(response.data); // Send the place details back to the frontend
  } catch (error) {
    console.error('Google Place Details API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});


// Route to get postal code using Geocoding API
router.get('/geocode', async (req, res) => {
    const { lat, lng } = req.query;
  
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
      );
  
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const addressComponents = response.data.results[0].address_components;
  
        // Extract postal code from address components
        const postalCode = addressComponents.find(comp => comp.types.includes('postal_code'))?.long_name || 'N/A';
  
        res.json({ postalCode });
      } else {
        res.status(404).json({ error: 'No postal code found for the given coordinates.' });
      }
    } catch (error) {
      console.error('Geocoding API Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch postal code.' });
    }
  });

module.exports = router;

