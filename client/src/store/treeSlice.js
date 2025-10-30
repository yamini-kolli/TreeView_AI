import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

export const fetchSessions = createAsyncThunk('tree/fetchSessions', async () => {
  const { data } = await api.get('/api/tree/sessions')
  return data
})

export const createSession = createAsyncThunk('tree/createSession', async (payload) => {
  const { data } = await api.post('/api/tree/sessions', payload)
  return data
})

export const deleteSession = createAsyncThunk('tree/deleteSession', async (id) => {
  await api.delete(`/api/tree/sessions/${id}`)
  return id
})

const slice = createSlice({
  name: 'tree',
  initialState: { sessions: [], current: null, status: 'idle' },
  reducers: {
    setCurrentSession(state, action) { state.current = action.payload },
  },
  extraReducers: (b) => {
    b.addCase(fetchSessions.fulfilled, (s, a) => { s.sessions = a.payload })
     .addCase(createSession.fulfilled, (s, a) => { s.sessions.unshift(a.payload) })
     .addCase(deleteSession.fulfilled, (s, a) => { s.sessions = s.sessions.filter(x => x.id !== a.payload) })
  }
})

export const { setCurrentSession } = slice.actions
export default slice.reducer


