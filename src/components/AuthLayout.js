import React from 'react';
import { FaTaxi, FaMapMarkedAlt, FaRoute, FaUserShield } from 'react-icons/fa';
import './Login.css';

// Two-column layout shared by the login and sign-up pages.
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="auth-page">
    <aside className="auth-hero" aria-hidden="true">
      <div className="auth-hero__brand">
        <span className="auth-hero__logo"><FaTaxi /></span>
        Smart Cabs
      </div>
      <h2 className="auth-hero__title">Find the nearest cab and follow it to your door.</h2>
      <ul className="auth-hero__list">
        <li><FaMapMarkedAlt /> Live map of available cabs around you</li>
        <li><FaRoute /> Driving route and ETA while your cab is on the way</li>
        <li><FaUserShield /> Admin tools for managing cabs and riders</li>
      </ul>
    </aside>
    <main className="auth-main">
      <div className="auth-card surface">
        <h1 className="auth-card__title">{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        {children}
        {footer && <p className="auth-card__footer">{footer}</p>}
      </div>
    </main>
  </div>
);

export default AuthLayout;
