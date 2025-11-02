import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchHistory, sendMessage, clearHistory, addLocalMessage } from '../store/chatSlice'
import { logout } from '../store/authSlice'
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
    if (current?.id === id) {
      if (data && (Array.isArray(data.nodes) || Array.isArray(data.edges))) {
        setNodes(Array.isArray(data.nodes) ? data.nodes : [])
        setEdges(Array.isArray(data.edges) ? data.edges : [])
        setNodeSeq(Array.isArray(data.nodes) ? data.nodes.length : 0)
      } else {
        // new session or no tree data: ensure the ReactFlow panel is empty
        setNodes([])
        setEdges([])
        setNodeSeq(0)
      }
    }
  }, [current?.id, current?.updated_at])

  const initialNodes = useMemo(() => ([]), [])
  const initialEdges = useMemo(() => ([]), [])

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [nodeSeq, setNodeSeq] = useState(0)
  const [highlightId, setHighlightId] = useState(null)
  const [highlightIds, setHighlightIds] = useState([])
  // only allow toasts for assistant messages created after a successful POST (sendMessage)
  // initialize to +Infinity to suppress all toasts from history GET responses
  const allowedToastAfterRef = useRef(Number.POSITIVE_INFINITY)

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
          // decide whether to show toasts based on whether this assistant message
          // was created after the most recent successful POST (sendMessage)
          const msgTime = lastAssistant.created_at ? new Date(lastAssistant.created_at).getTime() : Date.now()
          const allowToasts = msgTime >= (allowedToastAfterRef.current || 0)
          meta.operations.forEach(op => {
            const action = (op.action || '').toLowerCase()
            if (action === 'insert' && (op.value || op.label)) {
              // support parent linking info and direction
              const parentId = op.parent_id || op.node_id || op.parent || op.parentId || null
              const parentLabel = op.parent_label || op.parentLabel || op.parent_label || null
              const direction = op.direction || op.side || op.position || null
              insertNode(op.value || op.label, !allowToasts, { parentId, parentLabel, direction })
            } else if (action === 'delete' && (op.value || op.label || op.node_id)) {
              deleteNodeByValue(op.value || op.label || op.node_id, !allowToasts)
            } else if (action === 'connect' && (op.source || op.source_id) && (op.target || op.target_id)) {
                // explicit connect operation with binary-child enforcement
                const source = String(op.source || op.source_id)
                const target = String(op.target || op.target_id)
                const side = (op.side || op.direction || op.position || '').toLowerCase()

                // find source node and check existing children
                const sourceNode = nodes.find(n => String(n.id) === source)
                let existingLeft = false
                let existingRight = false
                edges.forEach(e => {
                  if (String(e.source) === source) {
                    const tgt = nodes.find(n => String(n.id) === String(e.target))
                    if (tgt && tgt.position && sourceNode && sourceNode.position) {
                      if ((tgt.position.x || 0) < (sourceNode.position.x || 0)) existingLeft = true
                      else existingRight = true
                    } else if (e.data && e.data.side) {
                      if (e.data.side === 'left') existingLeft = true
                      if (e.data.side === 'right') existingRight = true
                    } else {
                      // no reliable side info; do not assume occupancy
                    }
                  }
                })

                // if both occupied, notify and skip
                if (existingLeft && existingRight) {
                  try { dispatch(addLocalMessage({ id: `tmp-assist-${Date.now()}`, tree_session_id: id, message: 'Parent already has both left and right children. Cannot add another child.', is_user_message: false, created_at: new Date().toISOString() })) } catch (e) {}
                  if (!allowToasts) {} else toast.warn('Parent already has both children')
                  return
                }

                // if side specified and occupied, notify and skip
                if ((side === 'left' && existingLeft) || (side === 'right' && existingRight)) {
                  try { dispatch(addLocalMessage({ id: `tmp-assist-${Date.now()}`, tree_session_id: id, message: `Parent already has a ${side} child.`, is_user_message: false, created_at: new Date().toISOString() })) } catch (e) {}
                  if (!allowToasts) {} else toast.warn(`Parent already has a ${side} child`)
                  return
                }

                const edgeId = `e${source}-${target}`
                const newEdge = { id: edgeId, source, target, animated: true, style: { stroke: '#0d6efd', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0d6efd', width: 18, height: 18 }, data: { side: (side === 'left' || side === 'right') ? side : undefined } }
                setEdges(prev => [...prev, newEdge])
                if (!allowToasts) {
                  // suppressed by history/gating
                } else {
                  toast.success('Nodes linked')
              }
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

  // Insert a node. options can contain { parentId, parentLabel, direction }
  // direction can be 'left' or 'right' to position the new node relative to the parent
  const insertNode = (value, suppressToast = false, options = {}) => {
    const nextId = String(nodeSeq + 1)
    // default placement grid if no parent provided
    let x = Math.floor(nodes.length / 5) * 140
    let y = (nodes.length % 5) * 120

    const newNode = { id: nextId, data: { label: String(value) }, position: { x, y }, targetPosition: 'top', sourcePosition: 'bottom' }

    // if a parent is provided, try to position next to it and create an edge
    const parentId = options.parentId || null
    const parentLabel = options.parentLabel || null
    let parentNode = null
    if (parentId) parentNode = nodes.find(n => String(n.id) === String(parentId))
    if (!parentNode && parentLabel) parentNode = nodes.find(n => String(n.data?.label) === String(parentLabel))

    if (parentNode) {
      // determine existing children for this parent
      let existingLeft = false
      let existingRight = false
      edges.forEach(e => {
        if (String(e.source) === String(parentNode.id)) {
          // try to find the target node to determine side
          const tgt = nodes.find(n => String(n.id) === String(e.target))
          if (tgt && tgt.position && parentNode.position) {
            if ((tgt.position.x || 0) < (parentNode.position.x || 0)) existingLeft = true
            else existingRight = true
          } else if (e.data && e.data.side) {
            if (e.data.side === 'left') existingLeft = true
            if (e.data.side === 'right') existingRight = true
          } else {
            // no reliable info about this child side — do not assume occupancy
          }
        }
      })

      // desired direction
      const dir = (options.direction || '').toLowerCase()
      const desired = (dir === 'left' || dir === 'right') ? dir : 'right'

      // if both children exist, inform via assistant message and bail
      if (existingLeft && existingRight) {
        // add a local assistant message informing the user
        try {
          dispatch(addLocalMessage({ id: `tmp-assist-${Date.now()}`, tree_session_id: id, message: 'Parent already has both left and right children. Cannot add another child.', is_user_message: false, created_at: new Date().toISOString() }))
        } catch (e) {}
        if (!suppressToast) toast.warn('Parent already has both children')
        return
      }

      // if desired side already occupied, inform and bail
      if ((desired === 'left' && existingLeft) || (desired === 'right' && existingRight)) {
        try {
          dispatch(addLocalMessage({ id: `tmp-assist-${Date.now()}`, tree_session_id: id, message: `Parent already has a ${desired} child.`, is_user_message: false, created_at: new Date().toISOString() }))
        } catch (e) {}
        if (!suppressToast) toast.warn(`Parent already has a ${desired} child`)
        return
      }

      // position new node relative to parent: place it one level below (next step)
      if (parentNode.position) {
        const horizontalOffset = 160
        const verticalOffset = 120
        if (desired === 'left') x = (parentNode.position.x || 0) - horizontalOffset
        else x = (parentNode.position.x || 0) + horizontalOffset
        // place child one level below parent
        y = (parentNode.position.y || 0) + verticalOffset
        newNode.position = { x, y }
      }

      // create an edge parent -> child (source: parent, target: newNode) and tag side
      const edgeId = `e${parentNode.id}-${nextId}`
      const newEdge = { id: edgeId, source: String(parentNode.id), target: String(nextId), animated: true, style: { stroke: '#0d6efd', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0d6efd', width: 18, height: 18 }, data: { side: desired } }

      // use functional updates to avoid stale closures
      setNodes((prev) => [...prev, newNode])
      setEdges((prev) => [...prev, newEdge])
      setNodeSeq((n) => n + 1)
      if (!suppressToast) toast.success('Node added')
      return
    }

    // fallback: add without parent link
    setNodes((prev) => [...prev, newNode])
    setNodeSeq((n) => n + 1)
    if (!suppressToast) toast.success('Node added')
  }

  const deleteNodeByValue = (value, suppressToast = false) => {
    // allow deleting by label or id
    const target = nodes.find(n => String(n.data?.label) === String(value) || String(n.id) === String(value))
    if (!target) { if (!suppressToast) toast.warn('Node not found'); return }
    setNodes((prev) => prev.filter(n => n.id !== target.id))
    setEdges((prev) => prev.filter(e => e.source !== target.id && e.target !== target.id))
    if (!suppressToast) toast.success('Node deleted')
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
    // optimistic UI: show user's message immediately on the right
    const tempId = `tmp-${Date.now()}`
    const userMsg = { id: tempId, tree_session_id: id, message: input, is_user_message: true, created_at: new Date().toISOString(), pending: true }
    dispatch(addLocalMessage(userMsg))
    try {
      await dispatch(sendMessage({ sessionId: id, message: input, current_tree_state: { nodes, edges } }))
      // allow toasts for assistant messages created after this POST
      allowedToastAfterRef.current = Date.now()
    } catch (err) {
      // leave optimistic message; consider marking failed in future
    }
    setInput('')
  }

  const containerRef = useRef(null)
  // default split: ReactFlow panel 70% / Assistant panel 30%
  const [leftPct, setLeftPct] = useState(70)
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
      <div className="d-flex align-items-center justify-content-start mb-3" style={{ padding: '6px 8px' }}>
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
          {messages.map((m) => {
            const key = m.id || m.created_at || Math.random()
            const isUser = !!m.is_user_message
            let text = m.message || ''
            // prefer parsed reply for assistant messages if present
            if (!isUser && m.response) {
              if (typeof m.response === 'string') {
                try { const parsed = JSON.parse(m.response); if (parsed && parsed.reply) text = parsed.reply; else text = m.message || m.response } catch (e) { text = m.message || m.response }
              } else if (typeof m.response === 'object') {
                text = m.response.reply || m.message || JSON.stringify(m.response)
              }
            }

            return (
              <div key={key} className={`mb-3 d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
                <div style={{ maxWidth: '74%' }}>
                  <div className="small text-muted mb-1" style={{ fontWeight: 600 }}>{isUser ? 'You' : (m.username || 'AI')}</div>
                  {isUser ? (
                    <div style={{ background: '#eef6ff', color: '#0d6efd', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(13,110,253,0.12)', textAlign: 'right' }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                    </div>
                  ) : (
                    <div style={{ background: '#e8fff4', color: '#0b6b3a', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(11,107,58,0.08)' }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.username || 'Assistant'}</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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


