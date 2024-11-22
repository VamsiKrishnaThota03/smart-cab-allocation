import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import AdminNavbar from './AdminNavbar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [cabDetails, setCabDetails] = useState({
    name: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    pincode: '',
    town: '',
    bookedStatus: 'Available',
    bookedWith: '',
  });

  // Load Google Maps Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBQ8nmutuyTUzyBeY7WoAyA0A7qc4qZeTQ', // Replace with your API key
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCabDetails((prevDetails) => ({ ...prevDetails, [name]: value }));

    if (name === 'latitude' || name === 'longitude') {
      const lat = parseFloat(cabDetails.latitude);
      const lng = parseFloat(cabDetails.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMarkerPosition({ lat, lng });
      }
    }
  };

  // Update marker position on map click
  const handleMapClick = (event) => {
    console.log(event);
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });
    setCabDetails((prevDetails) => ({
      ...prevDetails,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  // Fetch current location on map load
  useEffect(() => {
    if (isLoaded) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });
        setCabDetails((prevDetails) => ({
          ...prevDetails,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
      });
    }
  }, [isLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { latitude, longitude } = cabDetails;
    if (!latitude || !longitude) {
      alert('Please make sure the latitude and longitude are set.');
      return;
    }
    try {
      let postalCode = 'N/A';
      let town = 'N/A';
      const apiKey = 'AIzaSyBQ8nmutuyTUzyBeY7WoAyA0A7qc4qZeTQ'; 
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const res = await axios.get(geocodeUrl);
      console.log(res);
      const results = res.data.results;
  
      if (results.length > 0) {
        const addressComponents = results[0].address_components;
        addressComponents.forEach(component => {
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
          if (component.types.includes('locality')) {
            town = component.long_name;
          }
        });
      }
      const updatedCabDetails = { ...cabDetails, pincode: postalCode, town };
      setCabDetails(updatedCabDetails);

      const token = localStorage.getItem('auth-token');
      const response = await axios.post('http://localhost:5001/api/cabs/addCab', updatedCabDetails, {
        headers: {
          'auth-token': token
        }
      });

      if (response.status === 201) {
        alert('Cab details added successfully!');
        setCabDetails({
          name: '',
          phone: '',
          email: '',
          latitude: '',
          longitude: '',
          pincode: '',
          town: '',
          bookedStatus: 'Available',
          bookedWith: ''
        });
        navigator.geolocation.getCurrentPosition((position) => {
          console.log(position);
          const { latitude, longitude } = position.coords;
          setMarkerPosition({ lat: latitude, lng: longitude });
          setCabDetails((prevDetails) => ({
            ...prevDetails,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
        });
      } else {
        alert('Error adding cab details.');
      }
    } catch (error) {
      console.error('Error adding cab:', error);
    }
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
          <h2>Add Cab Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-container">
              <label>Name</label>
              <input type="text" name="name" value={cabDetails.name} onChange={handleInputChange} required />
            </div>
            <div className="input-container">
              <label>Phone</label>
              <input type="tel" name="phone" value={cabDetails.phone} onChange={handleInputChange} required />
            </div>
            <div className="input-container">
              <label>Email</label>
              <input type="email" name="email" value={cabDetails.email} onChange={handleInputChange} required />
            </div>
            <div className="input-container">
              <label>Latitude</label>
              <input type="text" name="latitude" value={cabDetails.latitude} onChange={handleInputChange} />
            </div>
            <div className="input-container">
              <label>Longitude</label>
              <input type="text" name="longitude" value={cabDetails.longitude} onChange={handleInputChange} />
            </div>
            <button type="submit" className="submit-button">Add Cab</button>
          </form>
        </div>
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={13}
            center={markerPosition}
            onClick={handleMapClick}
            onLoad={(map) => setMap(map)}
          >
            {markerPosition && <Marker position={markerPosition} />}
          </GoogleMap>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
