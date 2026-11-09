import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

test('redirects anonymous visitors to the login page', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
});

test('shows the sign-up form', async () => {
  window.history.pushState({}, '', '/signup');
  render(<App />);
  expect(await screen.findByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/name/i)).toBeRequired();
});
