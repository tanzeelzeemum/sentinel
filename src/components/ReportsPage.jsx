import { useEffect, useState } from 'react'
import { FilePlus2, Pencil, Trash2, X } from 'lucide-react'
import { createCase, deleteCase, getCases, updateCase } from '../api/cases'
import { useAuth } from '../context/AuthContext'

const emptyReport = { title: '', caseNumber: '', description: '', threatLevel: 'Low', status: 'Open' }

function normalizeReports(payload) {
  return Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.cases)
    ? payload.cases
    : Array.isArray(payload?.reports)
    ? payload.reports
    : Array.isArray(payload?.data)
    ? payload.data
    : []
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [form, setForm] = useState(emptyReport)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadReports = async () => {
    setLoading(true); setError('')
    try {
      const payload = await getCases()
      const reportList = normalizeReports(payload)
      setReports(reportList)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (user) loadReports() }, [user])

  const updateField = event => setForm({ ...form, [event.target.name]: event.target.value })
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyReport) }
  const startEdit = report => {
    setForm({ title: report.title, caseNumber: report.caseNumber, description: report.description, threatLevel: report.threatLevel, status: report.status })
    setEditingId(report._id); setShowForm(true); setMessage(''); setError('')
  }

  const submit = async event => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      if (editingId) await updateCase(editingId, form)
      else await createCase(form)
      setMessage(editingId ? 'Report updated.' : 'Report created.')
      closeForm()
      await loadReports()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return
    setError(''); setMessage('')
    try { await deleteCase(id); setMessage('Report deleted.'); await loadReports() }
    catch (err) { setError(err.message) }
  }

  const safeReports = Array.isArray(reports) ? reports : []

  return <section className="content reports-page">
    <div className="page-heading"><div><p className="eyebrow">Sentinel workspace</p><h1>Reports</h1><p className="muted">Create and manage your intelligence reports.</p></div><button className="button" onClick={() => { setShowForm(true); setMessage(''); setError('') }}><FilePlus2 size={17} />Create Report</button></div>
    {error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}
    {showForm && <form className="report-form" onSubmit={submit}><div className="form-heading"><h2>{editingId ? 'Edit Report' : 'Create Report'}</h2><button type="button" className="close-form" onClick={closeForm} aria-label="Close form"><X size={18} /></button></div><div className="form-grid"><label>Report Title<input required name="title" value={form.title} onChange={updateField} /></label><label>Case Number<input required name="caseNumber" value={form.caseNumber} onChange={updateField} /></label><label>Threat Level<select name="threatLevel" value={form.threatLevel} onChange={updateField}>{['Low', 'Medium', 'High', 'Critical'].map(value => <option key={value}>{value}</option>)}</select></label><label>Status<select name="status" value={form.status} onChange={updateField}>{['Open', 'Active', 'Review', 'Closed'].map(value => <option key={value}>{value}</option>)}</select></label><label className="wide-field">Description<textarea required name="description" rows="4" value={form.description} onChange={updateField} /></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><button className="button" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Report'}</button></div></form>}
    <section className="case-section reports-list"><h2>Saved Reports</h2>{loading ? <p className="muted">Loading reports...</p> : error ? null : safeReports.length === 0 ? <p className="muted">No reports created yet.</p> : <div className="table-wrap"><table><thead><tr><th>TITLE</th><th>CASE NUMBER</th><th>THREAT LEVEL</th><th>STATUS</th><th>CREATED</th><th>ACTIONS</th></tr></thead><tbody>{safeReports.map(report => <tr key={report._id}><td><b>{report.title}</b></td><td>{report.caseNumber}</td><td><span className={'badge ' + report.threatLevel.toLowerCase()}>{report.threatLevel}</span></td><td>{report.status}</td><td>{new Date(report.createdAt).toLocaleDateString()}</td><td className="report-actions"><button onClick={() => startEdit(report)} aria-label={`Edit ${report.title}`}><Pencil size={16} />Edit</button><button className="delete-button" onClick={() => remove(report._id)} aria-label={`Delete ${report.title}`}><Trash2 size={16} />Delete</button></td></tr>)}</tbody></table></div>}</section>
  </section>
}
