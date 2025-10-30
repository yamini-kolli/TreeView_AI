import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import treeReducer from './treeSlice'
import chatReducer from './chatSlice'

export default configureStore({
  reducer: {
    auth: authReducer,
    tree: treeReducer,
    chat: chatReducer,
  },
})


