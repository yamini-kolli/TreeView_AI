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
    <div className="container" style={{ maxWidth: 480 }}>
      <h3 className="mt-4 mb-3">Create Account</h3>
      {error && <div className="alert alert-danger py-2">{String(error)}</div>}
      <form onSubmit={onSubmit} className="d-grid gap-3">
        <input className="form-control" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        <input className="form-control" placeholder="Username" minLength={3} maxLength={50} value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
        <input className="form-control" placeholder="Full Name" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} />
        <input className="form-control" placeholder="Password (min 8 chars)" type="password" minLength={8} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <button className="btn btn-primary" type="submit">Sign up</button>
      </form>
      <p className="mt-3 small">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}


