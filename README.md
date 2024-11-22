Smart Cab Allocation System for Efficient Trip Planning






Project Overview

The Smart Cab Allocation System is designed to optimize cab allocation and enhance trip planning efficiency by using real-time location data. It leverages Google Maps APIs and the Haversine formula for location-based cab searches, providing both admins and users with a seamless experience for booking and managing rides.

Features
1. Admin's Cab Allocation Optimization
Objective:
To develop an algorithm that optimizes cab allocation by reducing the overall travel distance between cabs and trip start locations.

Key Tasks:
An algorithm suggests the best cab based on proximity to the trip's start location.
Real-time location data for cabs and trip start points is integrated.
The algorithm is tested for minimizing travel distance and improving trip efficiency.


2. Employee/User's Cab Search Optimization
Objective:
Enhance the user experience by providing relevant and nearby cab suggestions.

Key Tasks:
Utilize real-time data to display cabs currently engaged in trips that are still nearby the user’s location.
Provide quick and accurate cab suggestions based on proximity and availability.


3. Real-Time Location Data Integration
Objective:
Ensure seamless integration of real-time data to improve the accuracy of cab allocation and tracking.

Key Tasks:
Set up real-time tracking for cab locations using Google Maps APIs.
Integrate location data into the cab allocation algorithm for real-time updates.
Handle potential issues like data latency and inaccuracies to maintain system reliability.

Tech Stack
Frontend:
React.js: For building the user interface and creating dynamic web pages.
HTML/CSS: For structuring and styling the web application.
JavaScript (ES6): For client-side scripting and logic.
Bootstrap: For responsive design and UI components.

Backend:
Node.js: Server-side JavaScript runtime.
Express.js: Backend framework for building APIs and handling HTTP requests.
JWT (JSON Web Tokens): For user authentication and session management.
Express Validator: For validating and sanitizing input data.

Database:
MongoDB: NoSQL database to store user, cab, and trip data.

APIs & Libraries:
Google Maps API: For real-time location tracking, calculating distances, and rendering maps.
Mongoose: MongoDB object modeling for Node.js.
Haversine Formula: Used to calculate the distance between two latitudes/longitude

Prerequisites
Location-Detectable Devices:
Ensure that users have location detection enabled on their devices (laptops, smartphones) to allow the system to fetch accurate current positions for cab searches.

Google Maps API Access:
The platform uses Google Maps to fetch latitude, longitude, pincode, town, and actual road points for cab tracking and real-time trip management. Ensure you have valid API keys set up for Maps functionality.

Project Structure
Backend  

/backend
│
├── /config
│   └── db.js                   # Database configuration (MongoDB connection)
│
├── /controllers
│   ├── authController.js        # Authentication logic (register, login, getUser)
│   ├── cabController.js         # Cab-related logic (e.g., add, book, available cabs)
│   └── adminController.js       # Admin logic (manage users, view stats)
│
├── /middleware
│   └── fetchUser.js             # Middleware to authenticate and authorize users (check if admin)
│
├── /models
│   ├── Cab.js                   # Cab model schema (driver, vehicle info, availability)
│   └── User.js                  # User model schema (user details, role for admin/user)
│
├── /routes
│   ├── authRoutes.js            # Routes for authentication (register, login, getUser)
│   ├── cabRoutes.js             # Routes for cab actions (addCab, availableCabs, bookCab, endTrip)
│   └── adminRoutes.js           # Admin routes (manage users, view stats)
│
├── server.js                    # Entry point for backend server (express app)
└── /utils
    └── validation.js            # Utility for input validation, e.g., email, password strength


Frontend

/src
│
├── /components
│   ├── AdminDashboard.js        # Admin view for managing users and cabs
│   ├── AdminNavbar.js           # Navbar for the admin panel
│   ├── Home.js                  # Home view for users (display available cabs, book cabs)
│   ├── Login.js                 # Login form (for both users and admin)
│   ├── Navbar.js                # Navbar for user views
│   ├── PrivateRoute.js          # Route guard to protect user-specific and admin routes
│   ├── SignUp.js                # User sign-up form
│   ├── UserDetails.js           # User profile details (edit profile)
│   ├── MyCab.js                 # Cab booking and tracking (book, track, cancel trips)
│   ├── AdminUsers.js            # Admin component for managing users (view, delete, update)
│   ├── AdminUsers.css           # New styling for Admin Users page
│
│
├── index.js                     # Main React entry point
└── App.js                       # Main application component (including routing and state management)


Smart Cab Allocation System for Efficient Trip Planning
Project Overview
The Smart Cab Allocation System is designed to optimize cab allocation and enhance trip planning efficiency by using real-time location data. It leverages Google Maps APIs and the Haversine formula for location-based cab searches, providing both admins and users with a seamless experience for booking and managing rides.

Features
1. Admin's Cab Allocation Optimization
Objective:
To develop an algorithm that optimizes cab allocation by reducing the overall travel distance between cabs and trip start locations.

Key Tasks:

An algorithm suggests the best cab based on proximity to the trip's start location.
Real-time location data for cabs and trip start points is integrated.
The algorithm is tested for minimizing travel distance and improving trip efficiency.
2. Employee/User's Cab Search Optimization
Objective:
Enhance the user experience by providing relevant and nearby cab suggestions.

Key Tasks:

Utilize real-time data to display cabs currently engaged in trips that are still nearby the user’s location.
Provide quick and accurate cab suggestions based on proximity and availability.
3. Real-Time Location Data Integration
Objective:
Ensure seamless integration of real-time data to improve the accuracy of cab allocation and tracking.

Key Tasks:

Set up real-time tracking for cab locations using Google Maps APIs.
Integrate location data into the cab allocation algorithm for real-time updates.
Handle potential issues like data latency and inaccuracies to maintain system reliability.
Prerequisites
Location-Detectable Devices:
Ensure that users have location detection enabled on their devices (laptops, smartphones) to allow the system to fetch accurate current positions for cab searches.

Google Maps API Access:
The platform uses Google Maps to fetch latitude, longitude, pincode, town, and actual road points for cab tracking and real-time trip management. Ensure you have valid API keys set up for Maps functionality.


API Endpoints

Authentication APIs

POST /api/auth/register – Register a new user.
POST /api/auth/login – Login and receive a JWT token.
GET /api/auth/getUser – Get authenticated user details.

Cab APIs

POST /api/cabs/addCab – Admin adds a new cab.
GET /api/cabs/availableCabs – Fetch all available cabs for users.
POST /api/cabs/bookCab/:cabId – Book a cab by ID.
POST /api/cabs/endTrip/:cabId – End a trip by cab ID, making it available again.


Nearest Cab Algorithm
The system uses the Haversine formula to calculate the distance between the user’s location and available cabs. Cabs within the same pincode or within a 5 km radius are considered for the "nearest cabs" list.

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
};


Features
Real-Time Cab Tracking:
Users can track the live location of their booked cab through Google Maps, with an animation showing the cab's movement and ETA.

Booking & Trip Management:
Once a cab is booked, it is marked as unavailable for other users. Admins and users can track and end trips, updating cab availability.

Admin Dashboard:
Admins can manage cabs, Admins can also add new cabs by clicking on map locations.


Authentication
The platform uses JWT (JSON Web Tokens) for secure user authentication and Express Validator for data validation.

Example for JWT:

const jwt = require('jsonwebtoken');

const authenticateUser = (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token required');
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send('Invalid Token');
    }
};

Admin Credentials:
Email: admin@gmail.com
Password: 12345678


Prerequisites
Location-Enabled Devices:
The platform requires devices with location detection capabilities to find and track nearby cabs.

Google Maps API:
Ensure you have access to Google Maps services for cab location tracking and route display.

Video Demonstration
Watch a detailed demonstration of the system here: 
https://drive.google.com/drive/folders/19pFYFNtk_M4D7LHCnGs-dzpYozc9B9bo?usp=sharing

Conclusion
The Smart Cab Allocation System optimizes cab management using real-time data and location-based algorithms. With a robust backend and seamless frontend experience, this platform is built for scalability, security, and efficiency.
