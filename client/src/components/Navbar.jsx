import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout } from '../store/authSlice'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const token = useSelector(s => s.auth.token)

  const onLogout = () => {
    // dispatch redux logout which also clears localStorage in reducer
    dispatch(logout())
    // ensure token removed from localStorage in case reducer didn't run yet
    try { localStorage.removeItem('tvai_token') } catch (e) {}
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">TreeView AI</Link>
        <div className="d-flex">
          {token ? (
            <button className="btn btn-outline-danger" onClick={onLogout}>Logout</button>
          ) : (
            <>
              <Link className="btn btn-outline-primary me-2" to="/login">Login</Link>
              <Link className="btn btn-primary" to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
