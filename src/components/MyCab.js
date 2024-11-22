import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import axios from 'axios';

const calculateDistance = (fromLat, fromLng, toLat, toLng) => {
  const toRadians = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const calculateTime = (distance) => {
  const speed = 200; // Assuming cab speed is 200 km/h
  return (distance / speed) * 60; // Time in minutes
};

const formatTime = (minutes) => {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} seconds`;
  } else if (minutes < 60) {
    const mins = Math.floor(minutes);
    return `${mins} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours} hrs ${remainingMinutes > 0 ? remainingMinutes + ' mins' : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days} days ${hours > 0 ? hours + ' hrs' : ''}`;
  }
};

const MyCab = () => {
  const location = useLocation();
  console.log(location);
  const navigate = useNavigate();
  const { bookedCab, fromLat, fromLng, toLat, toLng } = location.state || {};
  const [cabPosition, setCabPosition] = useState({ lat: bookedCab.lat, lng: bookedCab.lng });
  const [distanceRemaining, setDistanceRemaining] = useState(calculateDistance(bookedCab.lat, bookedCab.lng, fromLat, fromLng));
  const [estimatedTime, setEstimatedTime] = useState(formatTime(calculateTime(distanceRemaining))); // Updated with speed-based calculation
  const [map, setMap] = useState(null);
  const [cabMarker, setCabMarker] = useState(null);
  const [path, setPath] = useState(null); // Store the path along the road
  const [isEndTripEnabled, setIsEndTripEnabled] = useState(false); // Disable button initially

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(document.getElementById('myCabMap'), {
        center: { lat: bookedCab.lat, lng: bookedCab.lng },
        zoom: 13,
      });
      setMap(mapInstance);

      const newCabMarker = new window.google.maps.Marker({
        position: cabPosition,
        map: mapInstance,
        icon: {
          url: 'https://img.icons8.com/color/48/taxi.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
        title: 'Your Cab',
      });

      setCabMarker(newCabMarker);
    };

    const loadGoogleMapsScript = () => {
      if (!document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBQ8nmutuyTUzyBeY7WoAyA0A7qc4qZeTQ&callback=initMap`;
        script.async = true;
        window.initMap = initMap;
        document.body.appendChild(script);
      } else if (window.google && !map) {
        initMap(); // Initialize map if script is already loaded
      }
    };

    loadGoogleMapsScript();
  }, [map]);

  // Get directions (path along roads) from cab location to user's current location
  useEffect(() => {
    if (map && bookedCab) {
      const directionsService = new window.google.maps.DirectionsService();

      const request = {
        origin: new window.google.maps.LatLng(bookedCab.lat, bookedCab.lng),
        destination: new window.google.maps.LatLng(fromLat, fromLng), // Destination is user's current location
        travelMode: 'DRIVING',
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          const directionsRenderer = new window.google.maps.DirectionsRenderer();
          directionsRenderer.setDirections(result);
          directionsRenderer.setMap(map);

          const route = result.routes[0].overview_path;
          setPath(route); // Set the route along the roads
        } else {
          console.error('Directions request failed due to ' + status);
        }
      });
    }
  }, [map, bookedCab, fromLat, fromLng]);

  // Simulate the cab moving along the path and update time and distance
  useEffect(() => {
    if (path && path.length > 0) {
      let step = 0; // Start from the first step of the path
  
      const interval = setInterval(() => {
        if (step < path.length) {
          const nextPosition = path[step];
          const nextLat = nextPosition.lat();
          const nextLng = nextPosition.lng();
  
          const newDistance = calculateDistance(nextLat, nextLng, fromLat, fromLng); // Distance to the user's current location
          console.log('Current Distance:', newDistance); // Debugging log
          
          // Update the estimated time based on the new distance
          const newTime = calculateTime(newDistance);
          setEstimatedTime(formatTime(newTime));

          setDistanceRemaining(newDistance);
  
          // Update cab's position on the map
          setCabPosition({ lat: nextLat, lng: nextLng });
          cabMarker.setPosition(nextPosition);
          map.setCenter(nextPosition);
  
          step += 10; // Move by a smaller step for accuracy
          if (newDistance < 0.4) { // Threshold to consider it "reached"
            console.log('Cab has reached the user location');
            clearInterval(interval); // Stop the cab at user's current location
          
            // Directly set the cab's position and center the map at user's location
            cabMarker.setPosition(new window.google.maps.LatLng(fromLat, fromLng));
            map.setCenter({ lat: fromLat, lng: fromLng });
            
            alert('Cab Arrived..');
            setIsEndTripEnabled(true); // Enable "End Trip" button
          }
          
        }
      }, 1000); // You can increase speed by reducing the delay to, e.g., 500ms
  
      return () => clearInterval(interval);
    }
  }, [path, cabMarker, map, fromLat, fromLng]);

  const endTrip = async () => {
    try {
      const response = await axios.post(`http://localhost:5001/api/cabs/endTrip/${bookedCab.id}`, {
        destinationLat: toLat, 
        destinationLng: toLng,
      });
  
      alert(response.data.message);
      navigate('/'); // Redirect to the home page after trip ends
    } catch (error) {
      console.error('Error ending the trip:', error);
      alert('Failed to end the trip.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <h2 style={{ textAlign: 'center', padding: '10px', backgroundColor: '#007bff', color: '#fff' }}>
        Your Cab is on the Way!
      </h2>
      <div id="myCabMap" style={{ flex: 1, width: '100%' }}></div>
      <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f1f1f1' }}>
      {!isEndTripEnabled ? (
        <p><strong>Your Cab will arrive in:</strong> {estimatedTime}...</p>
      ) : (
        <p><strong>Your Cab has arrived</strong></p>
      )}
        <button
          onClick={endTrip}
          disabled={!isEndTripEnabled} // Disable until cab reaches user's location
          style={{
            padding: '10px 15px',
            backgroundColor: isEndTripEnabled ? '#28a745' : '#d9534f',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isEndTripEnabled ? 'pointer' : 'not-allowed',
            marginTop: '20px',
          }}
        >
          End Trip
        </button>
      </div>
    </div>
  );
};

export default MyCab;