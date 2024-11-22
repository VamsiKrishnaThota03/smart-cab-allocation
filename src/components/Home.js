import React, { useEffect, useRef, useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper function to format time based on conditions
const formatTime = (minutes) => {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} seconds`;
  } else if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
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

// Helper function to format location coordinates
const formatLocation = (lat, lng) => {
  const formatLat = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const formatLng = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${formatLat}, ${formatLng}`;
};

const Home = () => {
  const navigate = useNavigate();
  const [bookedCab, setBookedCab] = useState(null); // Track booked cab
  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null); // Store the map instance
  const [from, setFrom] = useState(''); // Automatically fill with lat, lng
  const [to, setTo] = useState(''); // Automatically fill with lat, lng
  const [cabs, setCabs] = useState([]); // Store available cabs with distances
  const [nearestCabs, setNearestCabs] = useState([]); // Nearest cabs details
  const [locationError, setLocationError] = useState(false); // Track location error state
  const [userMarker, setUserMarker] = useState(null); // Store user's "From" marker
  const [toMarker, setToMarker] = useState(null); // Store user's "To" marker
  const [cabLocations, setCabLocations] = useState([]); 
  const nearestCabsRef = useRef(null); // Ref for nearest cabs section
  const availableCabsRef = useRef(null);

  // Haversine formula to calculate the distance between two lat/lng points
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

  // Calculate estimated time based on a fixed speed (e.g., 200 km/h)
  const calculateTime = (distance) => {
    const speed = 200; // Assuming cab speed is 200 km/h
    return (distance / speed) * 60; // Time in minutes
  };
  const getPincodeFromLatLng = async (lat, lng) => {
    const apiKey = 'AIzaSyBQ8nmutuyTUzyBeY7WoAyA0A7qc4qZeTQ'; 
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    try {
      const response = await axios.get(geocodeUrl);
      const results = response.data.results;
  
      if (results.length > 0) {
        const addressComponents = results[0].address_components;
        let town = null;
        let pincode = null;
  
        addressComponents.forEach(component => {
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
          if (component.types.includes('locality')) {
            town = component.long_name;
          }
        });
  
        return { town, pincode };
      }
    } catch (error) {
      console.error('Error fetching pincode:', error);
    }
  
    return null;
  };

  const findNearestCabs = async (fromLat, fromLng) => {
    if (!fromLat || !fromLng) {
      alert('Please provide a valid starting location.');
      return;
    }
  
    // Fetch the user's town or pincode using Google Maps API
    const userLocationData = await getPincodeFromLatLng(fromLat, fromLng);
    const userTown = userLocationData?.town;
    const userPincode = userLocationData?.pincode;
  
    // Calculate distances and time to reach for all cabs
    const updatedCabs = cabLocations.map((cab) => {
      const distance = calculateDistance(fromLat, fromLng, cab.lat, cab.lng);
      const timeToReach = calculateTime(distance);
      return { ...cab, distance, timeToReach };
    });
  
    const sortedCabs = updatedCabs.sort((a, b) => a.distance - b.distance);

    // Update the available cabs with sorted distances and time to reach
    setCabs(sortedCabs);
  
    // Filter the cabs that are either within 5km or in the same town or pincode
    const nearestCabsList = await Promise.all(
      updatedCabs.map(async (cab) => {
        // Get cab's town or pincode
        const cabLocationData = await getPincodeFromLatLng(cab.lat, cab.lng);
        const isInSameTownOrPincode =
          cabLocationData?.town === userTown || cabLocationData?.pincode === userPincode;
        const isWithinRadius = cab.distance <= 5;
  
        // Return only the cabs that satisfy the condition
        if (isInSameTownOrPincode || isWithinRadius) {
          return cab;
        }
        return null; // Exclude cabs that don't match the condition
      })
    );
  
    // Filter out null values and set the nearest cabs
    const validNearestCabs = nearestCabsList.filter((cab) => cab !== null);
    setNearestCabs(validNearestCabs); // Set the nearest cabs array

    // Scroll to the nearest cabs section
    if (validNearestCabs.length > 0) {
      nearestCabsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      availableCabsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  
  

  // Fetch available cabs from the backend and set cabLocations
  const fetchAvailableCabs = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/cabs/availableCabs');
      const locations = response.data.map((cab) => ({
        id: cab._id,
        lat: parseFloat(cab.latitude), // Convert latitude to a number
        lng: parseFloat(cab.longitude), // Convert longitude to a number
        name: cab.name,
      }));

      setCabLocations(locations); // Set cabLocations in state
    } catch (error) {
      console.error('Error fetching cabs:', error);
    }
  };
  const bookCab = async (cab) => {
    if (!to) {
      alert('Please provide a valid destination location.');
      return;
    }
    try {
      // Retrieve the token from localStorage
      const token = localStorage.getItem('auth-token');
      console.log(localStorage.getItem('auth-token'));
      if (!token) {
        alert('You are not logged in. Please log in to book a cab.');
        return;
      }
    
      // Send the request to book the cab using its ID and the token in the headers
      const response = await axios.post(`http://localhost:5001/api/cabs/bookCab/${cab.id}`, {}, {
        headers: {
          'auth-token': token // Use the token from localStorage
        }
      });
    
      // Handle success response
      if (response && response.data && response.data.message) {
        alert(response.data.message); // Show success message
        setBookedCab(cab); // Update the bookedCab state with the selected cab
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      console.error('Error booking the cab:', error.response ? error.response.data : error.message);
      alert('Error booking the cab. Please try again.');
    }
    
  };

  useEffect(() => {
    fetchAvailableCabs(); // Fetch cabs from backend when component mounts
  }, []);

  // Initialize Google Maps and add markers when `cabLocations` is ready
  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: 23.1815, lng: 79.9864 }, // Default center
        zoom: 13,
      });
      setMap(mapInstance);
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
  }, []);

  // Add markers when cab locations are updated and the map is ready
  useEffect(() => {
    if (map && cabLocations.length > 0) {
      // Clear existing markers before adding new ones (optional, for refreshing markers)
      cabLocations.forEach((location) => {
        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          icon: {
            url: 'https://img.icons8.com/color/48/taxi.png',
            scaledSize: new window.google.maps.Size(32, 32),
          },
          title: location.name,
        });
      });
    }
  }, [cabLocations, map]);

  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(location); // Set the user's current location
            setFrom(`${location.lat}, ${location.lng}`); // Set the "From" text box with lat, lng
            setLocationError(false); // Reset error if location is found
          },
          (error) => {
            if (!locationError) {
              alert('Unable to retrieve location. Please allow location access.');
              setLocationError(true); // Show error message only once
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000, // Set a timeout to avoid indefinite wait
            maximumAge: 0, // Prevent returning a cached position
          }
        );
      } else {
        if (!locationError) {
          alert('Geolocation is not supported by your browser.');
          setLocationError(true); // Show error message only once
        }
      }
    };

    if (!currentLocation) {
      getCurrentLocation(); // Fetch user's current location
    }

    if (map && currentLocation) {
      if (userMarker) {
        userMarker.setMap(null); // Remove the previous user marker if it exists
      }
      const newUserMarker = new window.google.maps.Marker({
        position: currentLocation,
        map: map,
        icon: {
          url: 'https://img.icons8.com/color/96/street-view.png',
          scaledSize: new window.google.maps.Size(64, 64),
        },
        title: 'You are here',
      });
      setUserMarker(newUserMarker); // Save the new user marker
      map.setCenter(currentLocation); // Center the map on user's current location
    }
  }, [currentLocation, map, locationError]);

  // Navigate to MyCab when a cab is booked
  if (bookedCab && currentLocation) {
    const [fromLat, fromLng] = from.split(',').map(parseFloat);
    const [toLat, toLng] = to.split(',').map(parseFloat);

    // Add a check to ensure 'to' coordinates are valid before navigating
    if (!toLat || !toLng) {
      alert('Please enter a valid destination location.');
      return;
    }

    navigate('/myCab', { state: { bookedCab, fromLat, fromLng, toLat, toLng } });
    return null; // Avoid rendering the rest of the Home component when navigating
  }

  return (
    <>
      <div>
        <Navbar />
        <div style={{ display: 'flex', height: '90vh' }}>
          {/* Left side form */}
          <div style={{ width: '30%', padding: '20px', boxSizing: 'border-box', backgroundColor: '#f8f9fa' }}>
            <h2>Search for Cabs</h2>
            <div>
              <label htmlFor="from"><strong>From</strong></label>
              <input
                type="text"
                id="from"
                value={from} // Automatically filled with lat, lng
                onChange={(e) => {
                  setFrom(e.target.value);
                  const [fromLat, fromLng] = e.target.value.split(',').map(parseFloat);
                  if (!isNaN(fromLat) && !isNaN(fromLng)) {
                    // Remove the previous "From" marker if it exists
                    if (userMarker) {
                      userMarker.setMap(null);
                    }
  
                    // Add a new marker at the updated "From" location
                    const newUserMarker = new window.google.maps.Marker({
                      position: { lat: fromLat, lng: fromLng },
                      map: map,
                      icon: {
                        url: 'https://img.icons8.com/color/96/street-view.png', // From location icon
                        scaledSize: new window.google.maps.Size(64, 64),
                      },
                      title: 'Start Location',
                    });
  
                    setUserMarker(newUserMarker); // Store the new "From" marker
                    map.setCenter({ lat: fromLat, lng: fromLng }); // Center the map on the updated "From" location
                  }
                }}
                style={{ width: '95%', padding: '8px', margin: '10px 0' }}
              />
            </div>
            <div>
              {/* Button to manually set "From" location */}
            <button
              onClick={() => {
                if (map) {
                  // Add a new click listener to set the new "From" marker
                  const listener = map.addListener('click', (mapsMouseEvent) => {
                    const clickedLocation = mapsMouseEvent.latLng.toJSON();
                    setCurrentLocation(clickedLocation); // Update location state
                    setFrom(`${clickedLocation.lat}, ${clickedLocation.lng}`); // Automatically fill the "From" box with lat, lng
                    console.log('Manual From Location Set:', clickedLocation);
  
                    // Remove the previous "From" marker if it exists
                    if (userMarker) {
                      userMarker.setMap(null);
                    }
  
                    // Add a new marker at the clicked location (For "From" location)
                    const newUserMarker = new window.google.maps.Marker({
                      position: clickedLocation,
                      map: map,
                      icon: {
                        url: 'https://img.icons8.com/color/96/street-view.png', // From location icon
                        scaledSize: new window.google.maps.Size(64, 64),
                      },
                      title: 'Manually Set From Location',
                    });
  
                    setUserMarker(newUserMarker); // Store the new "From" marker
  
                    map.setCenter(clickedLocation); // Recenter the map on the clicked location
                    listener.remove(); // Remove the listener after the user clicks
                  });
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#ff5722',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Enter Start Location from Maps
            </button>
            </div>
            <div>
              <label htmlFor="to"><strong>To</strong></label>
              <input
                type="text"
                id="to"
                value={to} // Automatically filled with lat, lng
                onChange={(e) => {
                  setTo(e.target.value);
                  const [toLat, toLng] = e.target.value.split(',').map(parseFloat);
                  if (!isNaN(toLat) && !isNaN(toLng)) {
                    // Remove the previous "To" marker if it exists
                    if (toMarker) {
                      toMarker.setMap(null);
                    }
  
                    // Add a new marker at the updated "To" location
                    const newToMarker = new window.google.maps.Marker({
                      position: { lat: toLat, lng: toLng },
                      map: map,
                      icon: {
                        url: 'https://img.icons8.com/color/96/marker.png', // To location icon
                        scaledSize: new window.google.maps.Size(64, 64),
                      },
                      title: 'To Location',
                    });
  
                    setToMarker(newToMarker); // Store the new "To" marker
                    map.setCenter({ lat: toLat, lng: toLng }); // Center the map on the updated "To" location
                  }
                }}
                style={{ width: '95%', padding: '8px', margin: '10px 0' }}
              />
            </div>
            <div>
              {/* Button to manually set "To" location */}
            <button
              onClick={() => {
                if (map) {
                  // Add a new click listener to set the new "To" marker
                  const listener = map.addListener('click', (mapsMouseEvent) => {
                    const clickedLocation = mapsMouseEvent.latLng.toJSON();
                    setTo(`${clickedLocation.lat}, ${clickedLocation.lng}`); // Automatically fill the "To" box with lat, lng
                    console.log('Manual To Location Set:', clickedLocation);
  
                    // Remove the previous "To" marker if it exists
                    if (toMarker) {
                      toMarker.setMap(null);
                    }
  
                    // Add a new marker at the clicked location (For "To" location)
                    const newToMarker = new window.google.maps.Marker({
                      position: clickedLocation,
                      map: map,
                      icon: {
                        url: 'https://img.icons8.com/color/96/marker.png', // To location icon
                        scaledSize: new window.google.maps.Size(64, 64),
                      },
                      title: 'Manually Set To Location',
                    });
  
                    setToMarker(newToMarker); // Store the new "To" marker
  
                    map.setCenter(clickedLocation); // Recenter the map on the clicked location
                    listener.remove(); // Remove the listener after the user clicks
                  });
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#4caf50',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Enter Destination from Maps
            </button>
            </div>
            <button
              onClick={() => {
                if (!to) {
                  alert('Please provide a valid destination location.');
                  return;
                }
                if (from) {
                  const [fromLat, fromLng] = from.split(',').map(parseFloat);
                  findNearestCabs(fromLat, fromLng);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Search Cabs
            </button>
            
          </div>
  
          {/* Right side map */}
          <div style={{ width: '70%' }}>
            <div id="map" style={{ height: '100%', width: '100%' }}></div>
          </div>
        </div>
        <div>
          <div ref={nearestCabsRef}>
          {nearestCabs.length > 0 && (
            <div style={{ margin: '20px 0' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#007bff' }}>Nearest Cabs</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {nearestCabs.map((cab) => (
                  <div
                    key={cab.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      padding: '20px',
                      width: '280px',
                      backgroundColor: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <h4 style={{ marginBottom: '10px', color: '#007bff' }}>
                      <p><strong>Captain: </strong>{cab.name}</p>
                    </h4>
                    <p><strong>Distance:</strong> {cab.distance.toFixed(2)} km</p>
                    <p><strong>Time to Reach:</strong> {formatTime(cab.timeToReach)}</p>
                    <p><strong>Location:</strong> {formatLocation(cab.lat, cab.lng)}</p>
                    <button
                      onClick={() => bookCab(cab)}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px',
                        transition: 'background-color 0.3s ease',
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = '#218838')}
                      onMouseOut={(e) => (e.target.style.backgroundColor = '#28a745')}
                    >
                      Book This Cab
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )} 
         </div>
          <div ref={availableCabsRef}>
          {/* Display all available cabs */}
          {cabs.length > 0 && (
            <div style={{ margin: '20px 0' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#007bff' }}>All Available Cabs</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {cabs.map((cab) => (
                  <div
                    key={cab.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      padding: '20px',
                      width: '280px',
                      backgroundColor: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <h4 style={{ marginBottom: '10px', color: '#007bff' }}>
                      <p><strong>Captain: </strong>{cab.name}</p>
                    </h4>
                    <p><strong>Distance:</strong> {cab.distance.toFixed(2)} km</p>
                    <p><strong>Time to Reach:</strong> {formatTime(cab.timeToReach)}</p>
                    <p><strong>Location:</strong> {formatLocation(cab.lat, cab.lng)}</p>
                    <button
                      onClick={() => bookCab(cab)}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px',
                        transition: 'background-color 0.3s ease',
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = '#218838')}
                      onMouseOut={(e) => (e.target.style.backgroundColor = '#28a745')}
                    >
                      Book This Cab
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};
export default Home