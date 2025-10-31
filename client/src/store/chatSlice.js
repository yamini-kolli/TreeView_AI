import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

export const fetchHistory = createAsyncThunk('chat/history', async (sessionId) => {
  const { data } = await api.get(`/api/chat/history/${sessionId}`)
  return data
})

export const sendMessage = createAsyncThunk('chat/send', async (payloadObj) => {
  // allow client to pass current tree state (nodes/edges) so the Supervisor Agent can make structural changes
  // payloadObj shape: { sessionId, message, current_tree_state }
  const { sessionId, message, current_tree_state } = payloadObj || {}
  const payload = { tree_session_id: sessionId, message }
  if (current_tree_state) payload.current_tree_state = current_tree_state
  const { data } = await api.post('/api/chat/message', payload)
  return data
})

export const clearHistory = createAsyncThunk('chat/clear', async (sessionId) => {
  const { data } = await api.delete(`/api/chat/history/${sessionId}`)
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
     .addCase(clearHistory.fulfilled, (s) => { s.messages = [] })
  }
})

export const { clearChat } = slice.actions
export default slice.reducer


