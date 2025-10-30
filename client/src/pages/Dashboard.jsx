import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSessions, createSession, deleteSession } from '../store/treeSlice'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { sessions } = useSelector(s => s.tree)
  const [name, setName] = useState('')

  useEffect(() => { dispatch(fetchSessions()) }, [])

  const createNew = async () => {
    if (!name.trim()) return
    await dispatch(createSession({ session_name: name, tree_type: 'bst', tree_data: {}, description: '' }))
    setName('')
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="m-0">Your Tree Sessions</h2>
          <div className="text-muted">Create, manage, and visualize your tree data structures</div>
        </div>
        <div className="input-group" style={{ maxWidth: 420 }}>
          <input className="form-control" placeholder="New session name" value={name} onChange={e=>setName(e.target.value)} />
          <button className="btn btn-primary" onClick={createNew}><span className="me-1">+</span> Create New Tree</button>
        </div>
      </div>

      <div className="row g-4">
        {sessions.map(s => (
          <div className="col-md-4" key={s.id}>
            <div className="border rounded-3 p-3 h-100 d-flex flex-column shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="bi bi-folder2-open fs-5 text-primary"></span>
                <h5 className="m-0">{s.session_name}</h5>
              </div>
              <div className="text-muted small">Created {new Date(s.created_at).toLocaleDateString()}</div>
              <div className="text-uppercase small mt-1">{s.tree_type}</div>
              <div className="mt-auto d-flex gap-2">
                <Link className="btn btn-outline-primary" to={`/session/${s.id}`}>Open</Link>
                <button className="btn btn-outline-danger" onClick={() => dispatch(deleteSession(s.id))}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="col-12">
            <div className="border border-dashed rounded-3 p-5 text-center text-muted">
              No sessions yet. Create your first tree using the form above.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


