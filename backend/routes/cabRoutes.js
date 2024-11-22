const express = require('express');
const fetchUser = require('../middleware/fetchUser');
const Cab = require('../models/Cab');
const router = express.Router();



// Define your routes
router.post('/addCab', fetchUser, async (req, res) => {
  try {
    console.log('Request Body:', req.body);  // Log to see incoming data
    const { name, phone, email, latitude, longitude, pincode, town, bookedStatus, bookedWith } = req.body;

    const newCab = new Cab({
      name,
      phone,
      email,
      latitude,
      longitude,
      pincode,
      town,
      bookedStatus,
      bookedWith,
    });

    await newCab.save();
    res.status(201).json({ message: 'Cab added successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// GET all available cabs
router.get('/availableCabs', async (req, res) => {
  try {
    const availableCabs = await Cab.find({ bookedStatus: 'Available' }).select('name latitude longitude');
    res.status(200).json(availableCabs);
  } catch (error) {
    console.error('Error fetching available cabs:', error);
    res.status(500).json({ error: 'Server error, failed to fetch cabs.' });
  }
});

// POST to book a cab
router.post('/bookCab/:cabId', fetchUser, async (req, res) => {
  try {
    const cabId = req.params.cabId;
    const userId = req.user;  // Extracted userId from token

    // Find the cab by ID and ensure it's available
    const cab = await Cab.findById(cabId);
    if (!cab) {
      return res.status(404).json({ error: 'Cab not found' });
    }

    if (cab.bookedStatus !== 'Available') {
      return res.status(400).json({ error: 'Cab is not available' });
    }

    // Update the cab's status and assign it to the user
    console.log('Cab before update:', cab);
    cab.bookedStatus = 'Not Available';
    cab.bookedWith = userId;

    await cab.save();
    console.log('Cab after update:', cab);
    res.status(200).json({ message: 'Cab booked successfully!', cab });
  } catch (error) {
    console.error('Error booking the cab:', error);
    res.status(500).json({ error: 'Server error, failed to book cab.' });
  }
});


router.post('/endTrip/:cabId', async (req, res) => {
  try {
    const { cabId } = req.params;
    const { destinationLat, destinationLng } = req.body;

    // Fetch the cab by ID
    const cab = await Cab.findById(cabId);
    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' });
    }

    // Update cab's location and availability status
    cab.latitude = destinationLat;
    cab.longitude = destinationLng;
    cab.bookedStatus = 'Available';
    cab.bookedWith = null;

    // Save changes
    await cab.save();

    res.status(200).json({ message: 'Trip ended successfully', cab });
  } catch (error) {
    console.error('Error ending the trip:', error);
    res.status(500).json({ message: 'Server error while ending trip' });
  }
});


module.exports = router; 
