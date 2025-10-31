import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSessions, createSession, deleteSession, updateSession } from '../store/treeSlice'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { sessions } = useSelector(s => s.tree)
  const [name, setName] = useState('')

  useEffect(() => { dispatch(fetchSessions()) }, [])

  const createNew = async (providedName) => {
    const finalName = (providedName ?? name).trim()
    if (!finalName) return
    await dispatch(createSession({ session_name: finalName, tree_type: 'bst', tree_data: {}, description: '' }))
    setName('')
    toast.success('Session created')
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="m-0">Your Tree Sessions</h2>
        <div className="text-muted">Create, manage, and visualize your tree data structures</div>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
        <div className="col">
          <button
            type="button"
            className="w-100 h-100 p-3 bg-white rounded-3 tvai-dashed tvai-card text-start"
            style={{ minHeight: 120 }}
            onClick={() => {
              if (name.trim()) { createNew(); return }
              const promptName = window.prompt('Name your new tree session:', 'New Tree')
              if (promptName !== null) createNew(promptName)
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                <i className="bi bi-plus-lg"></i>
              </div>
              <div>
                <div className="fw-semibold">Create New Tree</div>
                <div className="text-muted small">Start a new tree session</div>
              </div>
            </div>
          </button>
        </div>

        {sessions.map(s => (
          <div className="col" key={s.id}>
            <div className="bg-white border rounded-3 p-3 h-100 d-flex flex-column tvai-card" style={{ minHeight: 120 }}>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                  <i className="bi bi-folder2-open"></i>
                </div>
                <div>
                  <div className="fw-semibold">{s.session_name}</div>
                  <div className="text-muted small">Created {new Date(s.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="text-uppercase small text-muted mb-3">{s.tree_type}</div>
              <div className="mt-auto d-flex gap-2">
                <Link className="btn btn-primary" to={`/session/${s.id}`}>Open</Link>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    const newName = window.prompt('Rename session', s.session_name)
                    if (newName && newName.trim() && newName.trim() !== s.session_name) {
                      dispatch(updateSession({ id: s.id, changes: { session_name: newName.trim() } }))
                      toast.success('Session renamed')
                    }
                  }}
                >
                  Rename
                </button>
                <button className="btn btn-outline-danger" onClick={() => { dispatch(deleteSession(s.id)); toast.success('Session deleted') }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


