import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addCaseNote, assignOfficer, deleteCase, getCase, getCaseOfficers, getProfile, updateCaseStatus, updateThreatAssessment } from '../api/cases'

const labels = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical', open: 'Open', 'under-review': 'Under review', resolved: 'Resolved', closed: 'Closed' }
const statuses = ['open', 'under-review', 'resolved', 'closed']

function date(value) {
  return value ? new Date(value).toLocaleString() : '-'
}

export default function CaseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [alert, setAlert] = useState(null)
  const [profile, setProfile] = useState(null)
  const [officers, setOfficers] = useState([])
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('open')
  const [assignedOfficer, setAssignedOfficer] = useState('')
  const [assessment, setAssessment] = useState({ probability: 1, impact: 1, sourceReliability: 1, urgency: 1 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const role = profile?.role || 'officer'
  const canEdit = role === 'admin' || role === 'officer'
  const canAssign = role === 'admin'
  const canDelete = role === 'admin'

  const load = async () => {
    setError('')
    try {
      const [casePayload, profilePayload, officersPayload] = await Promise.all([getCase(id), getProfile(), getCaseOfficers()])
      setItem(casePayload.case)
      setAlert(casePayload.alert || null)
      setProfile(profilePayload.profile || null)
      setOfficers(Array.isArray(officersPayload.officers) ? officersPayload.officers : [])
      setStatus(casePayload.case?.status || 'open')
      setAssignedOfficer(casePayload.case?.assignedOfficer?._id || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const saveStatus = async event => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try { await updateCaseStatus(id, status); setMessage('Status updated.'); await load() } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const saveAssignment = async event => {
    event.preventDefault()
    if (!assignedOfficer) return
    setSaving(true); setError(''); setMessage('')
    try { await assignOfficer(id, assignedOfficer); setMessage('Officer assigned.'); await load() } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const saveNote = async event => {
    event.preventDefault()
    if (!note.trim()) return
    setSaving(true); setError(''); setMessage('')
    try { await addCaseNote(id, note); setNote(''); setMessage('Note added.'); await load() } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const saveAssessment = async event => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try { await updateThreatAssessment(id, assessment); setMessage('Threat assessment saved.'); await load() } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!window.confirm(`Delete case ${item.caseNumber}? This cannot be undone.`)) return
    try { await deleteCase(id); navigate('/cases', { replace: true }) } catch (err) { setError(err.message) }
  }

  if (loading) return <section className="content"><p className="muted">Loading case...</p></section>
  if (error && !item) return <section className="content"><p className="form-error">{error}</p></section>

  return <section className="content case-detail">
    <div className="page-heading"><div><p className="eyebrow">Case details</p><h1>{item.title}</h1><p className="muted">{item.caseNumber}</p></div><div className="detail-actions">{canEdit && <Link className="button" to={`/cases/${id}/edit`}>Edit</Link>}{canDelete && <button className="delete-button" onClick={remove}>Delete</button>}</div></div>
    {error && <p className="form-error">{error}</p>}
    {message && <p className="form-success">{message}</p>}
    <section className="detail-grid">
      <article><span>Threat Level</span><b><span className={'badge ' + item.threatLevel}>{labels[item.threatLevel] || item.threatLevel}</span></b></article>
      <article><span>Status</span><b>{labels[item.status] || item.status}</b></article>
      <article><span>Category</span><b>{item.category || 'General'}</b></article>
      <article><span>Location</span><b>{item.location || '-'}</b></article>
      <article><span>Creator</span><b>{item.createdBy?.name || item.createdByEmail}</b><small>{item.createdBy?.email || item.createdByEmail}</small></article>
      <article><span>Assigned Officer</span><b>{item.assignedOfficer?.name || item.assignedOfficer?.email || 'Unassigned'}</b><small>{item.assignedOfficer?.email || ''}</small></article>
      <article><span>Opened</span><b>{date(item.openedAt)}</b></article>
      <article><span>Due</span><b>{date(item.dueDate)}</b></article>
      <article><span>Closed</span><b>{date(item.closedAt)}</b></article>
      <article><span>Created</span><b>{date(item.createdAt)}</b></article>
      <article><span>Updated</span><b>{date(item.updatedAt)}</b></article>
      <article><span>Related Alert</span><b>{alert ? `${alert.status} ${labels[alert.threatLevel] || alert.threatLevel}` : 'No threat alert'}</b></article>
    </section>
    <section className="case-section"><h2>Description</h2><p>{item.description}</p>{item.tags?.length > 0 && <p className="tag-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</p>}</section>
    <div className="action-grid">
      {canEdit && <form className="case-section mini-form" onSubmit={saveStatus}><h2>Change Status</h2><label>Status<select value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label><button className="button" disabled={saving}>Save Status</button></form>}
      {canAssign && <form className="case-section mini-form" onSubmit={saveAssignment}><h2>Assign Officer</h2><label>Officer<select value={assignedOfficer} onChange={e => setAssignedOfficer(e.target.value)}><option value="">Select officer</option>{officers.map(officer => <option key={officer._id} value={officer._id}>{officer.name || officer.email}</option>)}</select></label><button className="button" disabled={saving || !assignedOfficer}>Assign</button></form>}
      <form className="case-section mini-form" onSubmit={saveAssessment}><h2>Threat Assessment</h2>{['probability', 'impact', 'sourceReliability', 'urgency'].map(field => <label key={field}>{field.replace(/([A-Z])/g, ' $1')}<input type="number" min="1" max="5" value={assessment[field]} onChange={e => setAssessment({ ...assessment, [field]: Number(e.target.value) })} /></label>)}<button className="button" disabled={saving}>Save Assessment</button></form>
    </div>
    <section className="case-section"><h2>Assessment Summary</h2>{item.threatAssessment ? <div className="detail-grid compact"><article><span>Probability</span><b>{item.threatAssessment.probability}</b></article><article><span>Impact</span><b>{item.threatAssessment.impact}</b></article><article><span>Source Reliability</span><b>{item.threatAssessment.sourceReliability}</b></article><article><span>Urgency</span><b>{item.threatAssessment.urgency}</b></article><article><span>Score</span><b>{item.threatAssessment.score}</b></article><article><span>Calculated Level</span><b>{labels[item.threatAssessment.calculatedLevel]}</b></article></div> : <p className="muted">No threat assessment recorded.</p>}</section>
    <section className="case-section notes"><h2>Notes</h2>{item.notes?.length ? item.notes.map(entry => <article key={entry._id}><p>{entry.text}</p><small>{entry.authorName || entry.authorEmail} - {date(entry.createdAt)}</small></article>) : <p className="muted">No notes yet.</p>}<form onSubmit={saveNote}><label>Add Note<textarea rows="3" value={note} onChange={e => setNote(e.target.value)} /></label><button className="button" disabled={saving || !note.trim()}>Add Note</button></form></section>
  </section>
}
