# Smart Cab Allocation

A full-stack cab booking app. Riders find the nearest available cab on Google Maps, book it and follow it along the driving route. Admins manage cabs and users. Built with React, Express, MongoDB and the Google Maps APIs.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express%204-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google%20Maps-API-4285F4?logo=googlemaps&logoColor=white)
![JWT](https://img.shields.io/badge/auth-JWT-000000?logo=jsonwebtokens)

This repository contains the **React frontend at the root** and the **Express API in `backend/`**. The same code is also published as two separate repositories, which is what the live deployment uses:

- Frontend: [smart-cab-allocation-frontend](https://github.com/VamsiKrishnaThota03/smart-cab-allocation-frontend)
- Backend: [smart-cab-allocation-backend](https://github.com/VamsiKrishnaThota03/smart-cab-allocation-backend)

The code here points at `http://localhost:5001` for local development. The split repos point at the deployed Render backend.

## Live demo

**https://smart-cab-allocation-frontend.vercel.app/login**

Admin demo account:

| Email | Password |
| --- | --- |
| `admin@gmail.com` | `12345678` |

## Overview

Cabs are stored in MongoDB with coordinates, town, pincode and a booking status. When a rider searches from a pickup location, the frontend works out the distance to every available cab with the Haversine formula and sorts them. It then builds a "nearest cabs" list of cabs that are within 5 km **or** share the rider's town or pincode (from Google reverse geocoding). Booking a cab marks it unavailable. The trip view draws the Google Directions route from the cab to the rider and animates the cab along it. Ending the trip moves the cab to the drop-off point and makes it available again.

### Nearest-cab distance

```js
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // km
};
```

## Features

**Riders**
- Sign up and log in with JWT auth. The token is kept in `localStorage`, and protected routes use a `PrivateRoute` guard.
- A Google Map shows your current location (browser Geolocation API) and every available cab as a taxi marker.
- Enter pickup ("From", filled in from your location) and drop-off ("To") coordinates to find cabs:
  - all available cabs are sorted by straight-line distance (Haversine formula), with an estimated time to reach you
  - the "nearest cabs" list keeps cabs within **5 km**, or in the same **town or pincode** (Google Geocoding API)
- Book a cab. It is marked unavailable for other users.
- **My Cab** page: the app draws a driving route from the cab to you (Google Directions API) and animates the cab marker along it, updating the remaining distance and ETA. When the cab arrives, **End Trip** unlocks and moves the cab to the drop-off point, making it available again.
- Profile page with the logged-in user's details

**Admins**
- Admin dashboard for adding a cab (name, phone, email, location). Set the location by clicking the map or typing coordinates; town and pincode are filled in by reverse geocoding.
- Manage users: list all users and delete non-admin users
- Admin-only routes check the `isAdmin` claim in the JWT

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18 (Create React App), React Router 6, `axios`, `jwt-decode`, `@react-google-maps/api`, Google Maps JavaScript API |
| Backend | Node.js, Express 4, Mongoose 8, `jsonwebtoken`, `bcryptjs`, `express-validator`, `axios`, Socket.IO, `dotenv`, `cors` |
| Database | MongoDB |
| External APIs | Google Maps (Maps JS, Directions, Geocoding, Places) |

## Project structure

```
smart-cab-allocation/
├── backend/
│   ├── server.js            # Express + Socket.IO entry (port 5001)
│   ├── config/db.js         # MongoDB connection
│   ├── controllers/         # auth, admin (cabController.js is not mounted)
│   ├── middleware/          # fetchUser (JWT), isAdmin
│   ├── models/              # User, Cab
│   └── routes/              # auth, cabs, admin, places/geocode
├── public/
└── src/
    ├── App.js               # routes
    └── components/          # Home, MyCab, Login, SignUp, UserDetails,
                             # AdminDashboard, AdminUsers, Navbar, PrivateRoute
```

## Getting started

### Prerequisites

- Node.js and npm
- A MongoDB database (local or Atlas)
- A Google Maps API key with the Maps JavaScript, Directions, Geocoding and Places APIs enabled
- A browser with location access enabled

### Install

```bash
git clone https://github.com/VamsiKrishnaThota03/smart-cab-allocation.git
cd smart-cab-allocation
npm install                 # frontend (also installs nodemon / concurrently)
cd backend && npm install && cd ..
```

### Environment variables (`backend/.env`)

| Variable | Description |
| --- | --- |
| `PORT` | API port (optional, default `5001`) |
| `api` | Google Maps API key used by the backend places/geocode routes |
| `JWT_SECRET` | JWT signing secret |

```env
PORT=5001
api=<your-google-maps-api-key>
JWT_SECRET=<a-long-random-secret>
```

> **Note:** the current code hard-codes the MongoDB connection string (`backend/config/db.js`), the JWT secret (`backend/controllers/authController.js`, `backend/middleware/*.js`) and the frontend's Google Maps key (`src/components/Home.js`, `MyCab.js`, `AdminDashboard.js`). Replace them with your own values, ideally read from environment variables.

### Run

```bash
npm run both     # React dev server (:3000) + nodemon backend/server.js (:5001)
```

Or run them separately:

```bash
npm start                    # frontend
node backend/server.js       # backend
```

## API

Protected routes need the JWT in an `auth-token` header.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | - | Register (`name`, `email`, `password`) and return a JWT |
| POST | `/api/auth/login` | - | Log in and return `{ token, isAdmin }` |
| POST | `/api/auth/getuser` | User | Current user's profile |
| POST | `/api/cabs/addCab` | User | Add a cab |
| GET | `/api/cabs/availableCabs` | - | List available cabs |
| POST | `/api/cabs/bookCab/:cabId` | User | Book a cab |
| POST | `/api/cabs/endTrip/:cabId` | - | End the trip, move the cab to the drop-off point and free it |
| GET | `/api/admin/users` | Admin | List users |
| DELETE | `/api/admin/users/:id` | Admin | Delete a non-admin user |
| GET | `/api/places?lat=&lng=` | - | Google Places Nearby Search proxy |
| GET | `/api/place-details?placeId=` | - | Google Place Details proxy |
| GET | `/api/geocode?lat=&lng=` | - | Reverse geocode and return `{ postalCode }` |

The backend also runs a Socket.IO server that re-broadcasts `cabLocationUpdate` events. The current frontend does not use it; trip movement is animated on the client.
