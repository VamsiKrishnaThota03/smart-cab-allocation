import React from 'react';

// Placeholder shown inside a map area while it loads or when it cannot load.
const MapStatus = ({ missingKey, loadError }) => {
  if (missingKey) {
    return (
      <div className="map-status" role="status">
        <strong>Map unavailable</strong>
        <span>
          Set <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file and restart the app.
        </span>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="map-status" role="alert">
        <strong>Could not load Google Maps</strong>
        <span>Check your connection and API key, then reload the page.</span>
      </div>
    );
  }
  return (
    <div className="map-status" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Loading map…</span>
    </div>
  );
};

export default MapStatus;
