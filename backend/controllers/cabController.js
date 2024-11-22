const { body, validationResult } = require('express-validator');
const Cab = require('../models/Cab');
const Trip = require('../models/Trip');

// Find the nearest available cabs within 5 km
exports.findNearestCabs = [
  body('location')
    .isArray({ min: 2, max: 2 }).withMessage('Location must be an array of [longitude, latitude]'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { location } = req.body; // location: [longitude, latitude]
    try {
      const nearestCabs = await Cab.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location,
            },
            $maxDistance: 5001, // 5 km radius
          },
        },
        isAvailable: true,
      });

      if (nearestCabs.length === 0) {
        return res.status(404).json({ message: 'No available cabs nearby' });
      }

      res.json(nearestCabs);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  },
];

// Book the nearest available cab
exports.bookCab = [
  body('location')
    .isArray({ min: 2, max: 2 }).withMessage('Location must be an array of [longitude, latitude]'),
  body('destination').notEmpty().withMessage('Destination is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { location, destination } = req.body;
    try {
      // Find the nearest available cab
      const nearestCab = await Cab.findOne({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location,
            },
            $maxDistance: 5001, // 5 km radius
          },
        },
        isAvailable: true,
      });

      if (!nearestCab) {
        return res.status(404).json({ message: 'No available cabs found nearby' });
      }

      // Book the cab by creating a new trip
      const trip = new Trip({
        cab: nearestCab._id,
        user: req.user.id, // Assuming user is authenticated
        from: location,
        to: destination,
        status: 'booked',
      });

      await trip.save();

      // Mark the cab as booked
      nearestCab.isAvailable = false;
      await nearestCab.save();

      res.json({
        message: 'Cab booked successfully',
        cab: nearestCab,
        tripId: trip._id,
        estimatedArrivalTime: '5 minutes', // This could be dynamically calculated
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  },
];

// Update cab location (real-time tracking)
exports.updateCabLocation = [
  body('cabId').notEmpty().withMessage('Cab ID is required'),
  body('location')
    .isArray({ min: 2, max: 2 }).withMessage('Location must be an array of [longitude, latitude]'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { cabId, location } = req.body;
    try {
      const updatedCab = await Cab.findByIdAndUpdate(cabId, { location }, { new: true });
      if (!updatedCab) {
        return res.status(404).json({ message: 'Cab not found' });
      }
      res.json({ message: 'Cab location updated', cab: updatedCab });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  },
];

// Cancel a booking (free up cab)
exports.cancelBooking = [
  body('tripId').notEmpty().withMessage('Trip ID is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tripId } = req.body;
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      if (trip.status !== 'booked') {
        return res.status(400).json({ message: 'Booking cannot be cancelled' });
      }

      // Mark the trip as cancelled
      trip.status = 'cancelled';
      await trip.save();

      // Make the cab available again
      const cab = await Cab.findById(trip.cab);
      if (cab) {
        cab.isAvailable = true;
        await cab.save();
      }

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  },
];

// Toggle cab availability status
exports.toggleCabAvailability = [
  body('cabId').notEmpty().withMessage('Cab ID is required'),
  body('isAvailable').isBoolean().withMessage('Availability status is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { cabId, isAvailable } = req.body;
    try {
      const cab = await Cab.findByIdAndUpdate(cabId, { isAvailable }, { new: true });
      if (!cab) {
        return res.status(404).json({ message: 'Cab not found' });
      }

      res.json({ message: 'Cab availability updated', cab });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  },
];
