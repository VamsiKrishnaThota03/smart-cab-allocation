const express = require('express');
const mongoose = require('mongoose');
const { body, param } = require('express-validator');
const fetchUser = require('../middleware/fetchUser');
const isAdmin = require('../middleware/isAdmin');
const validate = require('../middleware/validate');
const Cab = require('../models/Cab');

const router = express.Router();

const validCabId = param('cabId')
  .custom((value) => mongoose.isValidObjectId(value))
  .withMessage('Invalid cab id');

// Add a cab (admin only)
router.post(
  '/addCab',
  fetchUser,
  isAdmin,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('pincode').optional().trim(),
  body('town').optional().trim(),
  validate,
  async (req, res) => {
    try {
      const { name, phone, email, latitude, longitude, pincode, town } = req.body;
      // Booking fields are always server-controlled for a new cab.
      const cab = await Cab.create({
        name,
        phone,
        email,
        latitude: String(latitude),
        longitude: String(longitude),
        pincode,
        town,
      });
      res.status(201).json({ message: 'Cab added successfully!', cab });
    } catch (error) {
      console.error('Add cab error:', error.message);
      res.status(500).json({ message: 'Server error, failed to add cab.' });
    }
  }
);

// List all available cabs (public)
router.get('/availableCabs', async (req, res) => {
  try {
    const availableCabs = await Cab.find({ bookedStatus: 'Available' }).select('name latitude longitude');
    res.status(200).json(availableCabs);
  } catch (error) {
    console.error('List cabs error:', error.message);
    res.status(500).json({ message: 'Server error, failed to fetch cabs.' });
  }
});

// The cab currently booked by the logged-in user (or null)
router.get('/myCab', fetchUser, async (req, res) => {
  try {
    const cab = await Cab.findOne({ bookedWith: String(req.user) }).select('name phone latitude longitude');
    res.json({ cab });
  } catch (error) {
    console.error('Fetch booking error:', error.message);
    res.status(500).json({ message: 'Server error, failed to fetch your booking.' });
  }
});

// Book an available cab for the logged-in user
router.post('/bookCab/:cabId', fetchUser, validCabId, validate, async (req, res) => {
  try {
    const userId = String(req.user);

    const existing = await Cab.findOne({ bookedWith: userId }).select('_id');
    if (existing && String(existing._id) !== req.params.cabId) {
      return res.status(409).json({ message: 'You already have an active booking. End that trip first.' });
    }

    // Atomic check-and-set so two riders cannot book the same cab.
    const cab = await Cab.findOneAndUpdate(
      { _id: req.params.cabId, bookedStatus: 'Available' },
      { bookedStatus: 'Not Available', bookedWith: userId },
      { new: true }
    );

    if (!cab) {
      const exists = await Cab.exists({ _id: req.params.cabId });
      return exists
        ? res.status(400).json({ message: 'Cab is not available' })
        : res.status(404).json({ message: 'Cab not found' });
    }

    res.status(200).json({ message: 'Cab booked successfully!', cab });
  } catch (error) {
    console.error('Book cab error:', error.message);
    res.status(500).json({ message: 'Server error, failed to book cab.' });
  }
});

// End a trip: move the cab to the drop-off point (if given) and free it up.
// Only the rider who booked the cab, or an admin, can end the trip.
router.post(
  '/endTrip/:cabId',
  fetchUser,
  validCabId,
  body('destinationLat').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).withMessage('Invalid destination latitude'),
  body('destinationLng').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).withMessage('Invalid destination longitude'),
  validate,
  async (req, res) => {
    try {
      const cab = await Cab.findById(req.params.cabId);
      if (!cab) return res.status(404).json({ message: 'Cab not found' });

      if (cab.bookedWith !== String(req.user) && !req.isAdmin) {
        return res.status(403).json({ message: 'You can only end your own trip' });
      }

      const { destinationLat, destinationLng } = req.body;
      if (destinationLat != null && destinationLng != null) {
        cab.latitude = String(destinationLat);
        cab.longitude = String(destinationLng);
      }
      cab.bookedStatus = 'Available';
      cab.bookedWith = '';
      await cab.save();

      res.status(200).json({ message: 'Trip ended successfully', cab });
    } catch (error) {
      console.error('End trip error:', error.message);
      res.status(500).json({ message: 'Server error while ending trip' });
    }
  }
);

module.exports = router;
