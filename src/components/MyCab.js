import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTaxi, FaCheckCircle, FaPhoneAlt } from 'react-icons/fa';
import Navbar from './Navbar';
import MapStatus from './MapStatus';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { API_URL } from '../config';
import { authHeaders, errorMessage } from '../utils/auth';
import { calculateDistance, calculateTime, formatDistance, formatTime } from '../utils/geo';
import { clearTrip, fetchActiveCab, loadTrip } from '../utils/trip';
import './MyCab.css';

const SIMULATION_STEPS = 30; // roughly 30 seconds from booking to arrival
const ARRIVAL_THRESHOLD_KM = 0.05;

// Straight line between two points, used when no driving route is available.
const straightLine = (from, to, steps = SIMULATION_STEPS) =>
  Array.from({ length: steps + 1 }, (_, i) => ({
    lat: from.lat + ((to.lat - from.lat) * i) / steps,
    lng: from.lng + ((to.lng - from.lng) * i) / steps,
  }));

const MyCab = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, loadError, missingKey } = useGoogleMaps();
  const [trip] = useState(() => location.state?.bookedCab ? location.state : loadTrip());

  const [orphanCab, setOrphanCab] = useState(null); // booked on the server but no local trip
  const [checking, setChecking] = useState(!trip);
  const [cabPosition, setCabPosition] = useState(trip ? { lat: trip.bookedCab.lat, lng: trip.bookedCab.lng } : null);
  const [path, setPath] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const cabMarkerRef = useRef(null);

  const pickup = trip ? { lat: trip.fromLat, lng: trip.fromLng } : null;
  const distanceRemaining = trip && cabPosition
    ? calculateDistance(cabPosition.lat, cabPosition.lng, trip.fromLat, trip.fromLng)
    : 0;

  // No trip in this tab: check whether the server still has a booking for us.
  useEffect(() => {
    if (trip) return;
    fetchActiveCab()
      .then(setOrphanCab)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [trip]);

  // Build the map and request the driving route from the cab to the pickup.
  useEffect(() => {
    if (!trip) return;
    const start = { lat: trip.bookedCab.lat, lng: trip.bookedCab.lng };
    const end = { lat: trip.fromLat, lng: trip.fromLng };

    if (!isLoaded) {
      if (missingKey || loadError) setPath((current) => current || straightLine(start, end));
      return;
    }
    if (mapRef.current || !mapDivRef.current) return;

    const map = new window.google.maps.Map(mapDivRef.current, {
      center: start,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapRef.current = map;
    cabMarkerRef.current = new window.google.maps.Marker({
      position: start,
      map,
      zIndex: 10,
      icon: { url: 'https://img.icons8.com/color/48/taxi.png', scaledSize: new window.google.maps.Size(40, 40) },
      title: 'Your cab',
    });

    new window.google.maps.DirectionsService().route(
      { origin: start, destination: end, travelMode: 'DRIVING' },
      (result, status) => {
        if (status === 'OK') {
          new window.google.maps.DirectionsRenderer({ map, directions: result, suppressMarkers: false, preserveViewport: false });
          const route = result.routes[0].overview_path.map((point) => point.toJSON());
          const stride = Math.max(1, Math.ceil(route.length / SIMULATION_STEPS));
          const sampled = route.filter((_, i) => i % stride === 0);
          sampled.push(end);
          setPath(sampled);
        } else {
          setPath(straightLine(start, end));
        }
      }
    );
  }, [trip, isLoaded, loadError, missingKey]);

  // Move the cab one step per second until it reaches the pickup.
  useEffect(() => {
    if (!path || path.length === 0) return undefined;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const next = path[Math.min(step, path.length - 1)];
      setCabPosition(next);
      cabMarkerRef.current?.setPosition(next);
      mapRef.current?.panTo(next);

      const remaining = calculateDistance(next.lat, next.lng, path[path.length - 1].lat, path[path.length - 1].lng);
      if (step >= path.length - 1 || remaining < ARRIVAL_THRESHOLD_KM) {
        clearInterval(interval);
        setArrived(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [path]);

  const endTrip = async (cabId, destination) => {
    setEnding(true);
    setError('');
    try {
      await axios.post(
        `${API_URL}/api/cabs/endTrip/${cabId}`,
        destination ? { destinationLat: destination.lat, destinationLng: destination.lng } : {},
        { headers: authHeaders() }
      );
      clearTrip();
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'Failed to end the trip.'));
      setEnding(false);
    }
  };

  if (!trip) {
    return (
      <>
        <Navbar />
        <main className="page">
          <div className="surface empty-state">
            {checking ? (
              <span className="spinner" role="status" aria-label="Checking your booking" />
            ) : orphanCab ? (
              <>
                <strong>You have an active booking with {orphanCab.name}</strong>
                <p>The trip details from this session are no longer available. Release the cab to book again.</p>
                {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}
                <button type="button" className="btn btn-dark" onClick={() => endTrip(orphanCab.id)} disabled={ending}>
                  {ending ? 'Releasing…' : 'Release cab'}
                </button>
              </>
            ) : (
              <>
                <strong>No active trip</strong>
                <p>Book a cab and you can follow it here.</p>
                <Link to="/" className="btn btn-accent">Find a cab</Link>
              </>
            )}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mycab-layout">
        <section className="mycab-map" aria-label="Live trip map">
          <div ref={mapDivRef} className="mycab-map__canvas" style={{ display: isLoaded ? 'block' : 'none' }} />
          {!isLoaded && <MapStatus missingKey={missingKey} loadError={loadError} />}
        </section>

        <aside className="mycab-panel surface">
          <div className={`mycab-status ${arrived ? 'is-arrived' : ''}`}>
            {arrived ? <FaCheckCircle aria-hidden="true" /> : <FaTaxi aria-hidden="true" />}
            <div>
              <span className="mycab-status__label">{arrived ? 'Your cab has arrived' : 'Your cab is on the way'}</span>
              <strong className="mycab-status__eta" aria-live="polite">
                {arrived ? 'Meet your captain at the pickup' : `Arrives in ${formatTime(calculateTime(distanceRemaining))}`}
              </strong>
            </div>
          </div>

          <dl className="mycab-details">
            <div>
              <dt>Captain</dt>
              <dd>{trip.bookedCab.name}</dd>
            </div>
            {trip.bookedCab.phone && (
              <div>
                <dt>Phone</dt>
                <dd><a href={`tel:${trip.bookedCab.phone}`}><FaPhoneAlt aria-hidden="true" /> {trip.bookedCab.phone}</a></dd>
              </div>
            )}
            <div>
              <dt>Distance to pickup</dt>
              <dd>{arrived ? '0 m' : formatDistance(distanceRemaining)}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}</dd>
            </div>
            <div>
              <dt>Drop-off</dt>
              <dd>{trip.toLat.toFixed(5)}, {trip.toLng.toFixed(5)}</dd>
            </div>
          </dl>

          {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}

          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={() => endTrip(trip.bookedCab.id, { lat: trip.toLat, lng: trip.toLng })}
            disabled={!arrived || ending}
          >
            {ending ? 'Ending trip…' : 'End trip'}
          </button>
          {!arrived && <p className="field-hint mycab-hint">You can end the trip once the cab reaches you.</p>}
        </aside>
      </div>
    </>
  );
};

export default MyCab;
