// client/backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cabRoutes = require('./routes/cabRoutes');
const placesRoute = require('./routes/placesRoute');
const adminRoutes = require('./routes/adminRoutes'); 
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cabs', cabRoutes); // Register cab routes
app.use('/api', placesRoute);
app.use('/api/admin', adminRoutes);


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('cabLocationUpdate', (data) => {
    io.emit('cabLocationUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
