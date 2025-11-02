import axios from 'axios'

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080',
  baseURL: import.meta.env.VITE_API_BASE || 'http://13.54.127.161:8080',
  
})

const tokenKey = 'tvai_token'

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api


