import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

export const fetchHistory = createAsyncThunk('chat/history', async (sessionId) => {
  const { data } = await api.get(`/api/chat/history/${sessionId}`)
  return data
})

export const sendMessage = createAsyncThunk('chat/send', async ({ sessionId, message }) => {
  const { data } = await api.post('/api/chat/message', { tree_session_id: sessionId, message })
  return data
})

const slice = createSlice({
  name: 'chat',
  initialState: { messages: [], loading: false },
  reducers: {
    clearChat(state) { state.messages = [] }
  },
  extraReducers: (b) => {
    b.addCase(fetchHistory.fulfilled, (s, a) => { s.messages = a.payload.messages || [] })
     .addCase(sendMessage.pending, (s) => { s.loading = true })
     .addCase(sendMessage.fulfilled, (s, a) => { s.loading = false; s.messages.push(a.payload) })
     .addCase(sendMessage.rejected, (s) => { s.loading = false })
  }
})

export const { clearChat } = slice.actions
export default slice.reducer


