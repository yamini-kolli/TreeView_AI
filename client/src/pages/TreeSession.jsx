import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { fetchHistory, sendMessage } from '../store/chatSlice'
import TreeControls from '../components/TreeControls'

export default function TreeSession() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { messages, loading } = useSelector(s => s.chat)
  const [input, setInput] = useState('')

  useEffect(() => { dispatch(fetchHistory(id)) }, [id])

  const initialNodes = useMemo(() => ([]), [])
  const initialEdges = useMemo(() => ([]), [])

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [nodeSeq, setNodeSeq] = useState(0)
  const [highlightId, setHighlightId] = useState(null)

  const insertNode = (value) => {
    const nextId = String(nodeSeq + 1)
    const y = (nodes.length % 5) * 120
    const x = Math.floor(nodes.length / 5) * 140
    const newNode = { id: nextId, data: { label: String(value) }, position: { x, y }, targetPosition: 'top', sourcePosition: 'bottom' }
    // standalone insertion: do not auto-link; user decides connections later
    setNodes([...nodes, newNode])
    setNodeSeq(nodeSeq + 1)
  }

  const deleteNodeByValue = (value) => {
    const target = nodes.find(n => n.data?.label == value)
    if (!target) return
    const remainingNodes = nodes.filter(n => n.id !== target.id)
    const remainingEdges = edges.filter(e => e.source !== target.id && e.target !== target.id)
    setNodes(remainingNodes)
    setEdges(remainingEdges)
  }

  const traverse = (type) => {
    if (nodes.length === 0) return
    // simple highlight animation across current order
    let i = 0
    const ids = nodes.map(n => n.id)
    const timer = setInterval(() => {
      setHighlightId(ids[i])
      i += 1
      if (i >= ids.length) { clearInterval(timer); setTimeout(()=>setHighlightId(null), 300) }
    }, 300)
  }

  const onSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    await dispatch(sendMessage({ sessionId: id, message: input }))
    setInput('')
  }

  const containerRef = useRef(null)
  const [leftPct, setLeftPct] = useState(50)
  const isDraggingRef = useRef(false)

  const onMouseDown = () => { isDraggingRef.current = true }
  const onMouseUp = () => { isDraggingRef.current = false }
  const onMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - rect.left, 200), rect.width - 200) // min/max widths
    setLeftPct((x / rect.width) * 100)
  }

  return (
    <div
      ref={containerRef}
      className="w-100"
      style={{ height: 600, display: 'flex', userSelect: isDraggingRef.current ? 'none' : 'auto' }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div style={{ width: `${leftPct}%`, minWidth: 300, paddingRight: 8 }}>
        <div className="h-100" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <TreeControls
            sessionName={`Tree ${id}`}
            onInsert={insertNode}
            onDelete={deleteNodeByValue}
            onTraverse={traverse}
            onReset={()=>{ setNodes([]); setEdges([]); setNodeSeq(0); setHighlightId(null) }}
            nodesCount={nodes.length}
            edgesCount={edges.length}
          />
          <div className="border rounded w-100 h-100">
          <ReactFlow
            nodes={nodes.map(n => ({...n, style: n.id===highlightId? { outline: '3px solid #0d6efd', borderRadius: 8 }: undefined }))}
            edges={edges}
            onConnect={(params) => setEdges((eds) => addEdge({ ...params }, eds))}
            onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
            onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
            fitView
            nodesDraggable
            nodesConnectable
            elementsSelectable
          >
            <MiniMap />
            <Controls />
            <Background gap={16} size={1} />
          </ReactFlow>
          </div>
        </div>
      </div>
      <div
        role="separator"
        onMouseDown={onMouseDown}
        style={{ width: 6, cursor: 'col-resize', background: '#e9ecef', borderLeft: '1px solid #dee2e6', borderRight: '1px solid #dee2e6' }}
      />
      <div className="d-flex flex-column" style={{ width: `${100 - leftPct}%`, minWidth: 320, paddingLeft: 8 }}>
        <div className="border rounded flex-grow-1 p-3 overflow-auto">
          {messages.map((m) => (
            <div key={m.id || m.created_at} className="mb-2">
              <div className="small text-muted">{m.is_user_message ? 'You' : 'AI'}</div>
              <div>{m.message}</div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-muted">No messages yet</div>}
        </div>
        <form onSubmit={onSend} className="mt-2 d-flex gap-2">
          <input className="form-control" placeholder="Type a command or question..." value={input} onChange={e=>setInput(e.target.value)} />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}


