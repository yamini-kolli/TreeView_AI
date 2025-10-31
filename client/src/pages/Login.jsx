import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, meThunk } from '../store/authSlice'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token, error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ username: '', password: '' })

  useEffect(() => {
    if (token) {
      dispatch(meThunk())
      navigate('/')
    }
  }, [token])

  const onSubmit = (e) => {
    e.preventDefault()
    dispatch(loginThunk(form))
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="w-100" style={{ maxWidth: 360 }}>
        <div className="p-4 bg-white border rounded-4 shadow" style={{ borderColor: '#b6d4fe' }}>
          <h3 className="mb-3 text-center text-primary">Login</h3>
        {error && <div className="alert alert-danger py-2">{String(error)}</div>}
        <form onSubmit={onSubmit} className="d-grid gap-3">
          <input className="form-control" placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
          <input className="form-control" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          <button className="btn btn-primary w-100" type="submit">Sign in</button>
        </form>
          <p className="mt-3 small text-center">No account? <Link to="/signup">Create one</Link></p>
        </div>
      </div>
    </div>
  )
}


