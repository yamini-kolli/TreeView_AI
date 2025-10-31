import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchHistory, sendMessage, clearHistory } from '../store/chatSlice'
import { getSession, updateSession } from '../store/treeSlice'
import { toast } from 'react-toastify'
import TreeControls from '../components/TreeControls'

export default function TreeSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { messages, loading } = useSelector(s => s.chat)
  const [input, setInput] = useState('')

  useEffect(() => { dispatch(fetchHistory(id)); dispatch(getSession(id)) }, [id])

  // load nodes/edges from current session
  const { current } = useSelector(s => s.tree)
  useEffect(() => {
    const data = current?.tree_data
    if (current?.id === id && data && (Array.isArray(data.nodes) || Array.isArray(data.edges))) {
      setNodes(Array.isArray(data.nodes) ? data.nodes : [])
      setEdges(Array.isArray(data.edges) ? data.edges : [])
      setNodeSeq(Array.isArray(data.nodes) ? data.nodes.length : 0)
    }
  }, [current?.id, current?.updated_at])

  const initialNodes = useMemo(() => ([]), [])
  const initialEdges = useMemo(() => ([]), [])

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [nodeSeq, setNodeSeq] = useState(0)
  const [highlightId, setHighlightId] = useState(null)
  const [highlightIds, setHighlightIds] = useState([])

  // react to assistant messages: perform operations and highlight nodes
  useEffect(() => {
    if (!messages || messages.length === 0) return
    // find last assistant message
    const lastAssistant = [...messages].reverse().find(m => !m.is_user_message)
    if (!lastAssistant) return
    try {
      const meta = lastAssistant.response ? JSON.parse(lastAssistant.response) : null
      if (meta) {
        // apply operations if present
        if (Array.isArray(meta.operations)) {
          meta.operations.forEach(op => {
            const action = (op.action || '').toLowerCase()
            if (action === 'insert' && (op.value || op.label)) {
              insertNode(op.value || op.label)
            } else if (action === 'delete' && (op.value || op.label)) {
              deleteNodeByValue(op.value || op.label)
            } else if (action === 'highlight' && op.node_id) {
              setHighlightId(String(op.node_id))
              setTimeout(() => setHighlightId(null), 2000)
            }
          })
        }
        // apply highlights array
        if (Array.isArray(meta.highlights) && meta.highlights.length > 0) {
          setHighlightIds(meta.highlights.map(String))
          // clear after a short time
          setTimeout(() => setHighlightIds([]), 2000)
        }
      }
    } catch (e) {
      // ignore parse errors
      // console.warn('Failed to parse assistant response', e)
    }
  }, [messages])

  const insertNode = (value) => {
    const nextId = String(nodeSeq + 1)
    const y = (nodes.length % 5) * 120
    const x = Math.floor(nodes.length / 5) * 140
    const newNode = { id: nextId, data: { label: String(value) }, position: { x, y }, targetPosition: 'top', sourcePosition: 'bottom' }
    // standalone insertion: do not auto-link; user decides connections later
    setNodes([...nodes, newNode])
    setNodeSeq(nodeSeq + 1)
    toast.success('Node added')
  }

  const deleteNodeByValue = (value) => {
    const target = nodes.find(n => n.data?.label == value)
    if (!target) { toast.warn('Node not found'); return }
    const remainingNodes = nodes.filter(n => n.id !== target.id)
    const remainingEdges = edges.filter(e => e.source !== target.id && e.target !== target.id)
    setNodes(remainingNodes)
    setEdges(remainingEdges)
    toast.success('Node deleted')
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
    await dispatch(sendMessage({ sessionId: id, message: input, current_tree_state: { nodes, edges } }))
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
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-light border" onClick={() => navigate(-1)}>Back</button>
          <h5 className="m-0">{current?.session_name || `Tree ${id}`}</h5>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-100"
        style={{ height: 'calc(100vh - 160px)', display: 'flex', userSelect: isDraggingRef.current ? 'none' : 'auto' }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
      <div style={{ width: `${leftPct}%`, minWidth: 300, paddingRight: 8 }}>
        <div className="h-100" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <TreeControls
            sessionName={current?.session_name || `Tree ${id}`}
            onInsert={insertNode}
            onDelete={deleteNodeByValue}
            onTraverse={traverse}
            onReset={()=>{ setNodes([]); setEdges([]); setNodeSeq(0); setHighlightId(null) }}
            onSave={async ()=>{
              try {
                const payload = { nodes, edges }
                await dispatch(updateSession({ id, changes: { tree_data: payload } }))
                toast.success('Changes saved')
              } catch (e) {
                toast.error('Failed to save')
              }
            }}
            nodesCount={nodes.length}
            edgesCount={edges.length}
          />
          <div className="border rounded w-100 h-100 bg-white">
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              style: {
                width: 84,
                height: 84,
                border: '2px solid #0d6efd',
                borderRadius: 8,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                fontWeight: 700,
                ...( (Array.isArray(highlightIds) && highlightIds.includes(String(n.id))) || String(n.id) === String(highlightId) ? { outline: '3px solid #0d6efd' } : {})
              }
            }))}
            edges={edges}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#0d6efd', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#0d6efd', width: 18, height: 18 }
            }}
            onConnect={(params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#0d6efd', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0d6efd', width: 18, height: 18 } }, eds))}
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
        <div className="border rounded flex-grow-1 overflow-auto bg-white d-flex flex-column">
          <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2">
            <div className="fw-semibold">AI Assistant</div>
            <div className="d-flex gap-2">
              <button className="btn btn-light btn-sm border" onClick={async ()=>{ await dispatch(clearHistory(id)) }} title="Clear chat"><i className="bi bi-trash"></i></button>
              <button className="btn btn-light btn-sm border" onClick={()=>{
                const dataStr = JSON.stringify(messages, null, 2)
                const blob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `chat-${id}.json`
                a.click()
                URL.revokeObjectURL(url)
              }} title="Export chat">Export</button>
            </div>
          </div>
          <div className="p-3" style={{ flex: 1, overflow: 'auto' }}>
          {messages.map((m) => (
            <div key={m.id || m.created_at} className="mb-2">
              <div className="small text-muted d-flex justify-content-between">
                <div>{m.is_user_message ? 'You' : 'AI'}</div>
                <div className="text-end">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
              </div>
              <div>{m.message}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-muted">
              <div className="mb-2">👋 Hello! I'm TreeView AI</div>
              <div className="small">Ask me to create tree structures or answer questions about trees!</div>
            </div>
          )}
          {loading && (
            <div className="text-muted mt-2 small">AI is typing...</div>
          )}
          </div>
        </div>
        <form onSubmit={onSend} className="mt-2 d-flex gap-2">
          <input className="form-control" placeholder="Type a command or question..." value={input} onChange={e=>setInput(e.target.value)} />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
    </div>
  )
}


