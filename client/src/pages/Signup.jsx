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
    if (res.type.endsWith('fulfilled')) navigate('/login')
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="w-100" style={{ maxWidth: 380 }}>
        <div className="p-4 bg-white border rounded-4 shadow" style={{ borderColor: '#b6d4fe' }}>
          <h3 className="mb-3 text-center text-primary">Create Account</h3>
        {error && <div className="alert alert-danger py-2">{String(error)}</div>}
        <form onSubmit={onSubmit} className="d-grid gap-3">
          <input className="form-control" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input className="form-control" placeholder="Username" minLength={3} maxLength={50} value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
          <input className="form-control" placeholder="Full Name" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} />
          <input className="form-control" placeholder="Password (min 8 chars)" type="password" minLength={8} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          <button className="btn btn-primary w-100" type="submit">Sign up</button>
        </form>
          <p className="mt-3 small text-center">Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  )
}


