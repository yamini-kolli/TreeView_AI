import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import TreeSession from './pages/TreeSession'
import { logout } from './store/authSlice'

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((s) => !!s.auth.token)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { token, user } = useSelector((s) => s.auth)

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg bg-light border-bottom px-3">
        <Link className="navbar-brand" to="/">TreeView AI</Link>
        <div className="ms-auto d-flex align-items-center gap-2">
          {token ? (
            <>
              <span className="text-muted small">{user?.username}</span>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => dispatch(logout())}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary btn-sm" to="/login">Login</Link>
              <Link className="btn btn-primary btn-sm" to="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
      <div className="container-fluid flex-grow-1 py-3">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><TreeSession /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
      <footer className="border-top py-2 text-center text-muted small">TreeView AI</footer>
    </div>
  )
}


