import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCase, getCase, getCaseOfficers, getProfile, updateCase } from '../api/cases'

const emptyCase = { title: '', caseNumber: '', description: '', category: 'General', location: '', threatLevel: 'low', status: 'open', assignedOfficer: '', tags: '', openedAt: '', dueDate: '' }
const threatOptions = [['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High'], ['critical', 'Critical']]
const statusOptions = [['open', 'Open'], ['under-review', 'Under review'], ['resolved', 'Resolved'], ['closed', 'Closed']]

function toInputDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export default function CaseFormPage({ edit = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyCase)
  const [profile, setProfile] = useState(null)
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(edit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([getProfile(), getCaseOfficers(), edit ? getCase(id) : Promise.resolve(null)])
      .then(([profilePayload, officersPayload, casePayload]) => {
        if (!mounted) return
        setProfile(profilePayload.profile || null)
        setOfficers(Array.isArray(officersPayload.officers) ? officersPayload.officers : [])
        if (casePayload?.case) {
          const item = casePayload.case
          setForm({
            title: item.title || '',
            caseNumber: item.caseNumber || '',
            description: item.description || '',
            category: item.category || 'General',
            location: item.location || '',
            threatLevel: item.threatLevel || 'low',
            status: item.status || 'open',
            assignedOfficer: item.assignedOfficer?._id || '',
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
            openedAt: toInputDate(item.openedAt),
            dueDate: toInputDate(item.dueDate)
          })
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [edit, id])

  const update = event => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async event => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    setMessage('')
    const payload = { ...form, tags: form.tags, openedAt: form.openedAt || undefined, dueDate: form.dueDate || undefined }
    try {
      const response = edit ? await updateCase(id, payload) : await createCase(payload)
      setMessage(edit ? 'Case updated.' : 'Case created.')
      navigate(`/cases/${response.case._id}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="content"><p className="muted">Loading case...</p></section>
  if (profile?.role === 'analyst') return <section className="content"><p className="form-error">You do not have permission to perform this action.</p></section>

  return <section className="content reports-page">
    <div className="page-heading"><div><p className="eyebrow">Case management</p><h1>{edit ? 'Edit Case' : 'Create Case'}</h1><p className="muted">Required fields are validated before submission.</p></div><Link className="secondary-button" to={edit ? `/cases/${id}` : '/cases'}>Cancel</Link></div>
    {error && <p className="form-error">{error}</p>}
    {message && <p className="form-success">{message}</p>}
    <form className="report-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Case Title<input required name="title" value={form.title} onChange={update} /></label>
        <label>Case Number<input required name="caseNumber" value={form.caseNumber} onChange={update} /></label>
        <label>Category<input name="category" value={form.category} onChange={update} /></label>
        <label>Location<input name="location" value={form.location} onChange={update} /></label>
        <label>Threat Level<select name="threatLevel" value={form.threatLevel} onChange={update}>{threatOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Status<select name="status" value={form.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {profile?.role === 'admin' && <label>Assigned Officer<select name="assignedOfficer" value={form.assignedOfficer} onChange={update}><option value="">Unassigned</option>{officers.map(officer => <option key={officer._id} value={officer._id}>{officer.name || officer.email}</option>)}</select></label>}
        <label>Tags<input name="tags" value={form.tags} onChange={update} placeholder="comma-separated tags" /></label>
        <label>Opened Date<input type="date" name="openedAt" value={form.openedAt} onChange={update} /></label>
        <label>Due Date<input type="date" name="dueDate" value={form.dueDate} onChange={update} /></label>
        <label className="wide-field">Description<textarea required name="description" rows="5" value={form.description} onChange={update} /></label>
      </div>
      <div className="form-actions"><button className="button" disabled={saving}>{saving ? 'Saving...' : edit ? 'Save Changes' : 'Create Case'}</button></div>
    </form>
  </section>
}
