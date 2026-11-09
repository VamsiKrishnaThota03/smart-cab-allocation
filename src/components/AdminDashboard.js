import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { FaCrosshairs } from 'react-icons/fa';
import AdminNavbar from './AdminNavbar';
import MapStatus from './MapStatus';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { API_URL } from '../config';
import { authHeaders, errorMessage } from '../utils/auth';
import { reverseGeocode } from '../utils/trip';
import './AdminDashboard.css';

const DEFAULT_CENTER = { lat: 23.1815, lng: 79.9864 };
const emptyCab = { name: '', phone: '', email: '', latitude: '', longitude: '' };

const toPosition = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  return Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng };
};

const AdminDashboard = () => {
  const { isLoaded, loadError, missingKey } = useGoogleMaps();
  const [cabDetails, setCabDetails] = useState(emptyCab);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const markerPosition = toPosition(cabDetails.latitude, cabDetails.longitude);

  const setPosition = ({ lat, lng }) =>
    setCabDetails((prev) => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        setPosition(position);
        setCenter(position);
      },
      () => setError('Location access is off. Click the map or type the coordinates.')
    );
  };

  // Start at the admin's current location when available.
  useEffect(() => {
    locateMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCabDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!markerPosition) {
      setError('Set the cab location by clicking the map or entering latitude and longitude.');
      return;
    }

    setSaving(true);
    try {
      const area = await reverseGeocode(markerPosition.lat, markerPosition.lng);
      await axios.post(
        `${API_URL}/api/cabs/addCab`,
        { ...cabDetails, pincode: area?.pincode || 'N/A', town: area?.town || 'N/A' },
        { headers: authHeaders() }
      );
      setSuccess(`${cabDetails.name} was added${area?.town ? ` in ${area.town}` : ''}.`);
      setCabDetails((prev) => ({ ...emptyCab, latitude: prev.latitude, longitude: prev.longitude }));
    } catch (err) {
      setError(errorMessage(err, 'Error adding cab details.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <main className="page admin-page">
        <div className="page-header">
          <h1>Add a cab</h1>
          <p>Enter the captain's details and drop a pin where the cab is parked.</p>
        </div>

        <div className="admin-grid">
          <form className="surface admin-form" onSubmit={handleSubmit}>
            {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}
            {success && <div className="alert-box alert-box--success" role="status">{success}</div>}

            <div className="field">
              <label htmlFor="cab-name">Captain name</label>
              <input id="cab-name" className="input" type="text" name="name" value={cabDetails.name} onChange={handleInputChange} required />
            </div>
            <div className="field">
              <label htmlFor="cab-phone">Phone</label>
              <input id="cab-phone" className="input" type="tel" name="phone" autoComplete="off" value={cabDetails.phone} onChange={handleInputChange} required />
            </div>
            <div className="field">
              <label htmlFor="cab-email">Email</label>
              <input id="cab-email" className="input" type="email" name="email" autoComplete="off" value={cabDetails.email} onChange={handleInputChange} required />
            </div>
            <div className="admin-form__row">
              <div className="field">
                <label htmlFor="cab-lat">Latitude</label>
                <input id="cab-lat" className="input" type="number" step="any" min="-90" max="90" name="latitude" value={cabDetails.latitude} onChange={handleInputChange} required />
              </div>
              <div className="field">
                <label htmlFor="cab-lng">Longitude</label>
                <input id="cab-lng" className="input" type="number" step="any" min="-180" max="180" name="longitude" value={cabDetails.longitude} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm admin-form__locate" onClick={locateMe}>
              <FaCrosshairs aria-hidden="true" /> Use my location
            </button>
            <p className="field-hint">Town and pincode are filled in automatically from the location.</p>

            <button type="submit" className="btn btn-accent btn-block" disabled={saving}>
              {saving ? 'Adding cab…' : 'Add cab'}
            </button>
          </form>

          <div className="surface admin-map">
            {isLoaded ? (
              <GoogleMap
                mapContainerClassName="admin-map__canvas"
                zoom={13}
                center={center}
                onClick={(event) => setPosition(event.latLng.toJSON())}
                options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
              >
                {markerPosition && <Marker position={markerPosition} />}
              </GoogleMap>
            ) : (
              <MapStatus missingKey={missingKey} loadError={loadError} />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;
