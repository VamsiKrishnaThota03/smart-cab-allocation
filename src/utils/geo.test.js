import { calculateDistance, formatTime, parseLatLng } from './geo';

test('haversine distance between two known points', () => {
  // Hyderabad to Bengaluru is roughly 500 km in a straight line
  const km = calculateDistance(17.385, 78.4867, 12.9716, 77.5946);
  expect(km).toBeGreaterThan(490);
  expect(km).toBeLessThan(510);
});

test('parses "lat, lng" text and rejects bad input', () => {
  expect(parseLatLng('17.38, 78.48')).toEqual({ lat: 17.38, lng: 78.48 });
  expect(parseLatLng('abc')).toBeNull();
  expect(parseLatLng('100, 10')).toBeNull();
});

test('formats travel time', () => {
  expect(formatTime(0.5)).toBe('30 sec');
  expect(formatTime(12.4)).toBe('12 min');
  expect(formatTime(75)).toBe('1 hr 15 min');
});
