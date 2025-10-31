import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
  const isAuthRoute = false

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <div className="container-fluid flex-grow-1 py-3">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><TreeSession /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
      
    </div>
  )
}


