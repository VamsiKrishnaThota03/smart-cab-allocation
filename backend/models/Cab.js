const mongoose = require('mongoose');

const CabSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  pincode: { type: String},
  town: { type: String},
  bookedStatus: { type: String, default: 'Available' },
  bookedWith: { type: String, default: '' },
});

module.exports = mongoose.model('Cab', CabSchema);
