import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCrosshairs, FaMapMarkerAlt, FaFlagCheckered, FaSearch, FaTaxi } from 'react-icons/fa';
import Navbar from './Navbar';
import MapStatus from './MapStatus';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { API_URL, NEAREST_RADIUS_KM } from '../config';
import { authHeaders, errorMessage } from '../utils/auth';
import {
  calculateDistance,
  calculateTime,
  formatDistance,
  formatLatLng,
  formatLocation,
  formatTime,
  parseLatLng,
} from '../utils/geo';
import { fetchActiveCab, reverseGeocode, saveTrip } from '../utils/trip';
import './Home.css';

const DEFAULT_CENTER = { lat: 23.1815, lng: 79.9864 };
const ICONS = {
  cab: 'https://img.icons8.com/color/48/taxi.png',
  from: 'https://img.icons8.com/color/96/street-view.png',
  to: 'https://img.icons8.com/color/96/marker.png',
};

const CabCard = ({ cab, onBook, booking, highlight }) => (
  <article className={`cab-card surface ${highlight ? 'cab-card--nearest' : ''}`}>
    <div className="cab-card__head">
      <span className="cab-card__icon" aria-hidden="true"><FaTaxi /></span>
      <div>
        <h4 className="cab-card__name">{cab.name}</h4>
        <span className="cab-card__meta">{formatLocation(cab.lat, cab.lng)}</span>
      </div>
    </div>
    <dl className="cab-card__stats">
      <div>
        <dt>Distance</dt>
        <dd>{formatDistance(cab.distance)}</dd>
      </div>
      <div>
        <dt>Arrives in</dt>
        <dd>{formatTime(cab.timeToReach)}</dd>
      </div>
    </dl>
    <button type="button" className="btn btn-dark btn-block" onClick={() => onBook(cab)} disabled={booking}>
      {booking ? 'Booking…' : 'Book this cab'}
    </button>
  </article>
);

const Home = () => {
  const navigate = useNavigate();
  const { isLoaded, loadError, missingKey } = useGoogleMaps();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [picking, setPicking] = useState(null); // 'from' | 'to' | null
  const [cabLocations, setCabLocations] = useState([]);
  const [loadingCabs, setLoadingCabs] = useState(true);
  const [results, setResults] = useState(null); // { all, nearest }
  const [searching, setSearching] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [activeCab, setActiveCab] = useState(null);

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ from: null, to: null, cabs: [] });
  const pickingRef = useRef(null);
  const resultsRef = useRef(null);

  pickingRef.current = picking;

  const placeMarker = useCallback((kind, position) => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    const existing = markersRef.current[kind];
    if (existing) existing.setMap(null);
    markersRef.current[kind] = new window.google.maps.Marker({
      position,
      map,
      icon: { url: ICONS[kind], scaledSize: new window.google.maps.Size(48, 48) },
      title: kind === 'from' ? 'Pickup' : 'Drop-off',
    });
    map.panTo(position);
  }, []);

  // Load available cabs and any active booking.
  useEffect(() => {
    axios
      .get(`${API_URL}/api/cabs/availableCabs`)
      .then(({ data }) =>
        setCabLocations(
          data.map((cab) => ({
            id: cab._id,
            name: cab.name,
            lat: parseFloat(cab.latitude),
            lng: parseFloat(cab.longitude),
          }))
        )
      )
      .catch((err) => setError(errorMessage(err, 'Could not load available cabs.')))
      .finally(() => setLoadingCabs(false));

    fetchActiveCab().then(setActiveCab).catch(() => {});
  }, []);

  // Use the browser location as the default pickup.
  useEffect(() => {
    if (!navigator.geolocation) {
      setInfo('Your browser does not support location. Pick your pickup point on the map.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setFrom((current) => current || formatLatLng(location));
      },
      () => setInfo('Location access is off. Type your pickup coordinates or pick them on the map.'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Create the map once the API is loaded.
  useEffect(() => {
    if (!isLoaded || mapRef.current || !mapDivRef.current) return;
    const map = new window.google.maps.Map(mapDivRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    map.addListener('click', (event) => {
      const kind = pickingRef.current;
      if (!kind) return;
      const text = formatLatLng(event.latLng.toJSON());
      if (kind === 'from') setFrom(text);
      else setTo(text);
      setPicking(null);
    });
    mapRef.current = map;
  }, [isLoaded]);

  // Keep the pickup / drop-off markers in sync with the inputs.
  useEffect(() => {
    const point = parseLatLng(from);
    if (isLoaded && point) placeMarker('from', point);
  }, [from, isLoaded, placeMarker]);

  useEffect(() => {
    const point = parseLatLng(to);
    if (isLoaded && point) placeMarker('to', point);
  }, [to, isLoaded, placeMarker]);

  // Cab markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    markersRef.current.cabs.forEach((marker) => marker.setMap(null));
    markersRef.current.cabs = cabLocations.map(
      (cab) =>
        new window.google.maps.Marker({
          position: { lat: cab.lat, lng: cab.lng },
          map: mapRef.current,
          icon: { url: ICONS.cab, scaledSize: new window.google.maps.Size(32, 32) },
          title: cab.name,
        })
    );
  }, [cabLocations, isLoaded]);

  const findNearestCabs = async (e) => {
    e.preventDefault();
    setError('');
    const pickup = parseLatLng(from);
    const dropoff = parseLatLng(to);
    if (!pickup) return setError('Enter a valid pickup location as "latitude, longitude".');
    if (!dropoff) return setError('Enter a valid drop-off location as "latitude, longitude".');

    setSearching(true);
    const all = cabLocations
      .map((cab) => {
        const distance = calculateDistance(pickup.lat, pickup.lng, cab.lat, cab.lng);
        return { ...cab, distance, timeToReach: calculateTime(distance) };
      })
      .sort((a, b) => a.distance - b.distance);

    // Nearest: within the radius, or in the same town / pincode as the pickup.
    const userArea = await reverseGeocode(pickup.lat, pickup.lng);
    const nearest = (
      await Promise.all(
        all.map(async (cab) => {
          if (cab.distance <= NEAREST_RADIUS_KM) return cab;
          if (!userArea) return null;
          const cabArea = await reverseGeocode(cab.lat, cab.lng);
          const sameTown = userArea.town && cabArea?.town === userArea.town;
          const samePincode = userArea.pincode && cabArea?.pincode === userArea.pincode;
          return sameTown || samePincode ? cab : null;
        })
      )
    ).filter(Boolean);

    setResults({ all, nearest });
    setSearching(false);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const bookCab = async (cab) => {
    const pickup = parseLatLng(from);
    const dropoff = parseLatLng(to);
    if (!pickup || !dropoff) return setError('Set both pickup and drop-off before booking.');

    setBookingId(cab.id);
    setError('');
    try {
      await axios.post(`${API_URL}/api/cabs/bookCab/${cab.id}`, {}, { headers: authHeaders() });
      const trip = {
        bookedCab: cab,
        fromLat: pickup.lat,
        fromLng: pickup.lng,
        toLat: dropoff.lat,
        toLng: dropoff.lng,
      };
      saveTrip(trip);
      navigate('/myCab', { state: trip });
    } catch (err) {
      setError(errorMessage(err, 'Error booking the cab. Please try again.'));
      setBookingId(null);
    }
  };

  const others = results ? results.all.filter((cab) => !results.nearest.some((n) => n.id === cab.id)) : [];

  return (
    <>
      <Navbar />
      <div className="home-layout">
        <aside className="home-panel">
          <h1 className="home-panel__title">Where are you going?</h1>
          <p className="home-panel__subtitle">
            {loadingCabs
              ? 'Loading cabs…'
              : `${cabLocations.length} cab${cabLocations.length === 1 ? '' : 's'} available right now`}
          </p>

          {activeCab && (
            <div className="alert-box alert-box--info">
              You have an active trip with <strong>{activeCab.name}</strong>. <Link to="/myCab">View trip</Link>
            </div>
          )}
          {info && <div className="alert-box alert-box--info" role="status">{info}</div>}
          {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}

          <form onSubmit={findNearestCabs}>
            <div className="field">
              <label htmlFor="from"><FaMapMarkerAlt className="field-icon field-icon--from" /> Pickup</label>
              <input
                id="from"
                className="input"
                placeholder="latitude, longitude"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-describedby="coords-hint"
              />
              <button
                type="button"
                className={`btn btn-ghost btn-sm pick-btn ${picking === 'from' ? 'is-active' : ''}`}
                onClick={() => setPicking(picking === 'from' ? null : 'from')}
                disabled={!isLoaded}
                aria-pressed={picking === 'from'}
              >
                <FaCrosshairs aria-hidden="true" /> {picking === 'from' ? 'Click the map…' : 'Pick on map'}
              </button>
            </div>

            <div className="field">
              <label htmlFor="to"><FaFlagCheckered className="field-icon field-icon--to" /> Drop-off</label>
              <input
                id="to"
                className="input"
                placeholder="latitude, longitude"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-describedby="coords-hint"
              />
              <button
                type="button"
                className={`btn btn-ghost btn-sm pick-btn ${picking === 'to' ? 'is-active' : ''}`}
                onClick={() => setPicking(picking === 'to' ? null : 'to')}
                disabled={!isLoaded}
                aria-pressed={picking === 'to'}
              >
                <FaCrosshairs aria-hidden="true" /> {picking === 'to' ? 'Click the map…' : 'Pick on map'}
              </button>
            </div>
            <p id="coords-hint" className="field-hint">
              Coordinates look like <code>17.385044, 78.486671</code>.
            </p>

            <button type="submit" className="btn btn-accent btn-block" disabled={searching || loadingCabs}>
              <FaSearch aria-hidden="true" /> {searching ? 'Searching…' : 'Search cabs'}
            </button>
          </form>
        </aside>

        <section className="home-map" aria-label="Map">
          {picking && <div className="home-map__hint">Click on the map to set the {picking === 'from' ? 'pickup' : 'drop-off'} point</div>}
          <div ref={mapDivRef} className="home-map__canvas" style={{ display: isLoaded ? 'block' : 'none' }} />
          {!isLoaded && <MapStatus missingKey={missingKey} loadError={loadError} />}
        </section>
      </div>

      <section ref={resultsRef} className="home-results page">
        {!results ? (
          <div className="empty-state surface">
            <strong>Search to see cabs near you</strong>
            Set your pickup and drop-off, then press “Search cabs”.
          </div>
        ) : results.all.length === 0 ? (
          <div className="empty-state surface">
            <strong>No cabs are available right now</strong>
            Please try again in a few minutes.
          </div>
        ) : (
          <>
            <h2 className="home-results__title">Nearest cabs</h2>
            {results.nearest.length === 0 ? (
              <p className="home-results__empty">
                No cabs within {NEAREST_RADIUS_KM} km or in your town. You can still book one from the list below.
              </p>
            ) : (
              <div className="cab-grid">
                {results.nearest.map((cab) => (
                  <CabCard key={cab.id} cab={cab} onBook={bookCab} booking={bookingId === cab.id} highlight />
                ))}
              </div>
            )}

            {others.length > 0 && (
              <>
                <h2 className="home-results__title">Other available cabs</h2>
                <div className="cab-grid">
                  {others.map((cab) => (
                    <CabCard key={cab.id} cab={cab} onBook={bookCab} booking={bookingId === cab.id} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
};

export default Home;
