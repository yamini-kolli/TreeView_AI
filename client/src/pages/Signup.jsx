import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { signupThunk } from '../store/authSlice'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })

  const onSubmit = async (e) => {
    e.preventDefault()
    const res = await dispatch(signupThunk(form))
    if (!res.error) {
      // Show success message and redirect to login
      alert('Account created successfully! Redirecting to your dashboard...')
      navigate('/')
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 44px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: 760 }}>
        <div className="p-4 bg-white tvai-form-card d-flex flex-column justify-content-center w-100" style={{ maxWidth: 520, width: '100%' }}>
          <h3 className="mb-2 text-center" style={{ color: '#071c3a', fontSize: '1.9rem', fontWeight: 800 }}>Create Account</h3>
          <div className="text-center tvai-subheading" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
            Join TreeView AI to start building beautiful tree structures in a single line
          </div>
          {error && <div className="alert alert-danger py-2">{String(error)}</div>}
          <form onSubmit={onSubmit} className="d-grid gap-3" style={{marginTop: '0.25rem'}}>
            <div>
              <label className="form-label small fw-semibold">Email</label>
              <input className="form-control tvai-input-medium" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
            </div>
            <div>
              <label className="form-label small fw-semibold">Username</label>
              <input className="form-control tvai-input-medium" placeholder="Username" minLength={3} maxLength={50} value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
            </div>
            <div>
              <label className="form-label small fw-semibold">Full Name</label>
              <input className="form-control tvai-input-medium" placeholder="Full Name" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} />
            </div>
            <div>
              <label className="form-label small fw-semibold">Password (min 8 chars)</label>
              <input className="form-control tvai-input-medium" placeholder="Password (min 8 chars)" type="password" minLength={8} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
            </div>
            <button className="btn btn-primary w-100" type="submit" style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.98rem' }}>Sign up</button>
          </form>
          <p className="mt-3 small text-center">Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  )
}


