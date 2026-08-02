import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { deleteCase, getCasesWithFilters, getProfile } from '../api/cases'

const threatOptions = [['', 'All threats'], ['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High'], ['critical', 'Critical']]
const statusOptions = [['', 'All statuses'], ['open', 'Open'], ['under-review', 'Under review'], ['resolved', 'Resolved'], ['closed', 'Closed']]
const labels = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical', open: 'Open', 'under-review': 'Under review', resolved: 'Resolved', closed: 'Closed' }

function normalizeList(payload) {
  return Array.isArray(payload?.cases) ? payload.cases : []
}

function canEdit(role, item, email) {
  if (role === 'admin') return true
  if (role !== 'officer') return false
  return item.createdByEmail === email || item.assignedOfficer?.email === email
}

export default function CasesPage() {
  const [cases, setCases] = useState([])
  const [profile, setProfile] = useState(null)
  const [filters, setFilters] = useState({ search: '', category: '', threatLevel: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const role = profile?.role || 'officer'
  const categories = useMemo(() => [...new Set(cases.map(item => item.category).filter(Boolean))], [cases])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [casePayload, profilePayload] = await Promise.all([getCasesWithFilters(filters), getProfile()])
      setCases(normalizeList(casePayload))
      setProfile(profilePayload.profile || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submitFilters = event => {
    event.preventDefault()
    load()
  }

  const remove = async item => {
    if (!window.confirm(`Delete case ${item.caseNumber}? This cannot be undone.`)) return
    setError('')
    setMessage('')
    try {
      await deleteCase(item._id)
      setMessage('Case deleted.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return <section className="content reports-page px-4 py-7 md:px-10 md:py-10">
    <div className="page-heading flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="eyebrow">Sentinel workspace</p><h1>Cases</h1><p className="muted">Search, review, and manage authorized cases.</p></div>
      {['admin', 'officer'].includes(role) && <Link className="button inline-flex items-center gap-2" to="/cases/new"><FilePlus2 size={17} />Create Case</Link>}
    </div>
    {error && <p className="form-error rounded-md p-3">{error}</p>}
    {message && <p className="form-success rounded-md p-3">{message}</p>}
    <form className="filters grid gap-4 md:grid-cols-[2fr_repeat(3,1fr)_auto]" onSubmit={submitFilters}>
      <label>Search<input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Title or case number" /></label>
      <label>Category<select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
      <label>Threat<select value={filters.threatLevel} onChange={e => setFilters({ ...filters, threatLevel: e.target.value })}>{threatOptions.map(([value, label]) => <option key={label} value={value}>{label}</option>)}</select></label>
      <label>Status<select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>{statusOptions.map(([value, label]) => <option key={label} value={value}>{label}</option>)}</select></label>
      <button className="secondary-button">Apply</button>
    </form>
    <section className="case-section reports-list overflow-hidden">
      <h2>Case List</h2>
      {loading ? <p className="muted">Loading cases...</p> : error ? null : cases.length === 0 ? <p className="muted rounded-md border border-dashed border-slate-300 p-4">No cases match the current filters.</p> : <div className="table-wrap overflow-x-auto"><table><thead><tr><th>CASE NUMBER</th><th>TITLE</th><th>CATEGORY</th><th>THREAT LEVEL</th><th>STATUS</th><th>ASSIGNED OFFICER</th><th>OPENED</th><th>ACTIONS</th></tr></thead><tbody>{cases.map(item => <tr key={item._id}><td>{item.caseNumber}</td><td><b>{item.title}</b></td><td>{item.category || 'General'}</td><td><span className={'badge ' + item.threatLevel}>{labels[item.threatLevel] || item.threatLevel}</span></td><td>{labels[item.status] || item.status}</td><td>{item.assignedOfficer?.name || item.assignedOfficer?.email || 'Unassigned'}</td><td>{item.openedAt ? new Date(item.openedAt).toLocaleDateString() : '-'}</td><td className="report-actions"><Link to={`/cases/${item._id}`}><Eye size={16} />View</Link>{canEdit(role, item, profile?.email) && <Link to={`/cases/${item._id}/edit`}><Pencil size={16} />Edit</Link>}{role === 'admin' && <button className="delete-button" onClick={() => remove(item)}><Trash2 size={16} />Delete</button>}</td></tr>)}</tbody></table></div>}
    </section>
  </section>
}
