import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // show logout on dashboard (/) and any session page (/session/*)
  const showLogout = location.pathname === '/' || location.pathname.startsWith('/session')

  const onLogout = () => {
    dispatch(logout())
    try { localStorage.removeItem('tvai_token') } catch (e) {}
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg" style={{ background: 'transparent', padding: '0.18rem 0', minHeight: 44 }}>
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <Link to="/" className="d-flex align-items-center" style={{ gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L7 8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3L17 8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="14" r="4" stroke="#fff" strokeWidth="1.6"/>
            </svg>
          </div>
          <div style={{ color: '#1480ff', fontWeight: 800, fontSize: '1.05rem' }}>TreeView AI</div>
        </Link>

        {showLogout ? (
          <div>
            <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>Logout</button>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
