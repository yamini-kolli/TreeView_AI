import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

const tokenKey = 'tvai_token'

export const signupThunk = createAsyncThunk('auth/signup', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/auth/register', payload)
    return data
  } catch (e) {
    const detail = e.response?.data?.detail
    if (Array.isArray(detail)) {
      // FastAPI validation error array → join messages
      const msg = detail.map(d => (d?.msg || JSON.stringify(d))).join('; ')
      return rejectWithValue(msg)
    }
    return rejectWithValue(detail || 'Sign up failed')
  }
})

export const loginThunk = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const { data } = await api.post('/api/auth/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    return data
  } catch (e) {
    return rejectWithValue(e.response?.data?.detail || 'Login failed')
  }
})

export const meThunk = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/user/me')
    return data
  } catch (e) {
    return rejectWithValue('Failed to get user')
  }
})

const initialState = {
  token: localStorage.getItem(tokenKey) || null,
  user: null,
  status: 'idle',
  error: null,
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem(tokenKey)
    },
    setToken(state, action) {
      state.token = action.payload
      if (action.payload) localStorage.setItem(tokenKey, action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.token = action.payload.access_token
        localStorage.setItem(tokenKey, state.token)
      })
      .addCase(signupThunk.fulfilled, (state) => {
        state.status = 'signed_up'
      })
      .addCase(meThunk.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addMatcher(
        (a) => a.type.startsWith('auth/') && a.type.endsWith('/rejected'),
        (state, action) => { state.error = action.payload }
      )
  }
})

export const { logout, setToken } = slice.actions
export default slice.reducer


