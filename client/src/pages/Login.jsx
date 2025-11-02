import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, meThunk } from '../store/authSlice'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token, error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (token) {
      dispatch(meThunk()).then(() => {
        navigate('/')
      })
    }
  }, [token])

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await dispatch(loginThunk(form))
      if (result.error) {
        // Login failed -> show user-friendly message at top of form
        setLoginError('Invalid email id or password')
        setIsSubmitting(false)
        return
      }
      // on success, clear any prior error and leave isSubmitting true until unmount
      setLoginError('')
    } catch (err) {
      // ensure button re-enabled on unexpected errors
      setLoginError('Invalid email id or password')
      setIsSubmitting(false)
    }
    // Login successful, token effect will handle navigation
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 44px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: 560 }}>
        <div className="p-4 bg-white tvai-form-card w-100" style={{ maxWidth: 520, width: '100%', boxSizing: 'border-box' }}>
          <h3 className="mb-2 text-center" style={{ color: '#071c3a', fontSize: '1.9rem', fontWeight: 800 }}>Welcome back</h3>
          <div className="text-center tvai-subheading" style={{ marginBottom: 14, fontWeight: 600 }}>
            Sign in to visualize and interact with tree data structure
          </div>
          {(loginError || error) && <div className="alert alert-danger py-2">{loginError || String(error)}</div>}
          <form onSubmit={onSubmit} className="d-grid gap-2" style={{ marginBottom: 6 }}>
            <div>
              <label className="form-label small fw-semibold">Email</label>
              <input className="form-control tvai-input-medium" placeholder="Email" type="email" value={form.email} onChange={e=>{ setForm({...form, email:e.target.value}); if (loginError) setLoginError('') }} required />
            </div>
            <div>
              <label className="form-label small fw-semibold">Password</label>
              <input className="form-control tvai-input-medium" placeholder="Password" type="password" value={form.password} onChange={e=>{ setForm({...form, password:e.target.value}); if (loginError) setLoginError('') }} required />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting} style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.98rem' }}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <p className="mt-3 small text-center">No account? <Link to="/signup">Create one</Link></p>
        </div>
      </div>
    </div>
  )
}


