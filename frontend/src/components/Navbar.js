import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GiKnifeFork } from 'react-icons/gi';
import { TbCalendarEvent } from 'react-icons/tb';
import { FiMenu, FiX } from 'react-icons/fi';
import '../styles/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`app-navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <GiKnifeFork size={28} />
          <span>Mazir</span>
        </Link>
        
        <div className={`nav-menu ${isOpen && 'active'}`}>
          <NavLink to="/book" className="nav-item">
            <TbCalendarEvent /> Book
          </NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className="nav-item">
                Hello, {user.name}
              </NavLink>
              <button className="nav-item logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-item">Login</NavLink>
              <NavLink to="/register" className="nav-item">Register</NavLink>
            </>
          )}
        </div>
        
        <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
