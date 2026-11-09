import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../config';

const MISSING_KEY_ERROR = new Error('REACT_APP_GOOGLE_MAPS_API_KEY is not set');

// Loads the Maps JavaScript API once for the whole app.
const useGoogleMaps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  if (!GOOGLE_MAPS_API_KEY) {
    return { isLoaded: false, loadError: MISSING_KEY_ERROR, missingKey: true };
  }
  return { isLoaded, loadError, missingKey: false };
};

export default useGoogleMaps;
