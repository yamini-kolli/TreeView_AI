import React, { useMemo, useState } from 'react'

export default function TreeControls({ onInsert, onDelete, onTraverse, onReset, sessionName = 'Tree', nodesCount = 0, edgesCount = 0 }) {
  const [addValue, setAddValue] = useState('')
  const [delValue, setDelValue] = useState('')
  const disabledInsert = useMemo(() => addValue.trim() === '', [addValue])
  const disabledDelete = useMemo(() => delValue.trim() === '', [delValue])

  return (
    <div className="p-3 bg-white border rounded-3 w-100" style={{ minWidth: 280 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="text-muted small">{sessionName}</div>
          <h5 className="m-0">Tree Controls</h5>
        </div>
        <button className="btn btn-primary" onClick={() => onReset?.()}>
          <span className="me-2 bi bi-floppy"></span>Save Changes
        </button>
      </div>

      <div className="mb-3">
        <div className="form-label">Add Node</div>
        <div className="input-group">
          <input className="form-control" placeholder="Enter value" value={addValue} onChange={(e)=>setAddValue(e.target.value)} />
          <button className="btn btn-primary" disabled={disabledInsert} onClick={() => { onInsert?.(addValue); setAddValue('') }}>
            <span className="bi bi-plus"></span>
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="form-label">Delete Node</div>
        <div className="input-group">
          <input className="form-control" placeholder="Enter node value" value={delValue} onChange={(e)=>setDelValue(e.target.value)} />
          <button className="btn btn-danger" disabled={disabledDelete} onClick={() => { onDelete?.(delValue); setDelValue('') }}>
            <span className="bi bi-trash"></span>
          </button>
        </div>
      </div>

      <div className="mb-2">Traversal Animations</div>
      <div className="d-grid gap-2 mb-3">
        <button className="btn btn-outline-secondary" onClick={() => onTraverse?.('preorder')}>Pre-order</button>
        <button className="btn btn-outline-secondary" onClick={() => onTraverse?.('inorder')}>In-order</button>
        <button className="btn btn-outline-secondary" onClick={() => onTraverse?.('postorder')}>Post-order</button>
      </div>

      <button className="btn btn-danger w-100" onClick={() => onReset?.()}>Reset Tree</button>

      <div className="mt-3 small text-muted">
        <div>Nodes: <span id="tvai-nodes-count">{nodesCount}</span></div>
        <div>Edges: <span id="tvai-edges-count">{edgesCount}</span></div>
      </div>
    </div>
  )
}


