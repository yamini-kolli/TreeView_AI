import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import TreeSession from './pages/TreeSession'
import { logout } from './store/authSlice'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((s) => !!s.auth.token)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AuthRoute({ children }) {
  const isAuthenticated = useSelector((s) => !!s.auth.token)
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { token, user } = useSelector((s) => s.auth)
  const isAuthRoute = false

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="container-fluid flex-grow-1 py-3">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><TreeSession /></ProtectedRoute>} />
          <Route path="/login" element={
            <div>
              {!token ? <Login /> : <Navigate to="/" replace />}
            </div>
          } />
          <Route path="/signup" element={
            <div>
              {!token ? <Signup /> : <Navigate to="/" replace />}
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}


