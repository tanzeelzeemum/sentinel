import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createReport, getCases, getProfile, getReport, updateReport } from '../api/cases'

const blank = { title: '', caseId: '', incidentDate: '', location: '', description: '', sourceReliability: 3, informationCredibility: 3, evidenceDescription: '' }

function dateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export default function ReportFormPage({ edit = false }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...blank, caseId: searchParams.get('caseId') || '' })
  const [cases, setCases] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([getCases(), getProfile(), edit ? getReport(id) : Promise.resolve(null)])
      .then(([casePayload, profilePayload, reportPayload]) => {
        if (!mounted) return
        setCases(Array.isArray(casePayload.cases) ? casePayload.cases : [])
        setProfile(profilePayload.profile || null)
        if (reportPayload?.report) {
          const report = reportPayload.report
          setForm({
            title: report.title || '',
            caseId: report.caseId?._id || report.caseId || '',
            incidentDate: dateInput(report.incidentDate),
            location: report.location || '',
            description: report.description || '',
            sourceReliability: report.sourceReliability || 3,
            informationCredibility: report.informationCredibility || 3,
            evidenceDescription: report.evidenceDescription || ''
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
    try {
      const payload = { ...form, caseId: form.caseId || null, sourceReliability: Number(form.sourceReliability), informationCredibility: Number(form.informationCredibility) }
      const response = edit ? await updateReport(id, payload) : await createReport(payload)
      setMessage(edit ? 'Report updated.' : 'Report created.')
      navigate(`/reports/${response.report._id}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="content px-4 py-7 md:px-10"><p className="muted">Loading report form...</p></section>
  if (profile?.role === 'analyst') return <section className="content px-4 py-7 md:px-10"><p className="form-error rounded-md p-3">You do not have permission to perform this action.</p></section>

  return <section className="content reports-page px-4 py-7 md:px-10 md:py-10">
    <div className="page-heading flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="eyebrow">Incident reporting</p><h1>{edit ? 'Edit Report' : 'Create Report'}</h1><p className="muted">Use fictional academic demonstration information only.</p></div>
      <Link className="secondary-button" to={edit ? `/reports/${id}` : '/reports'}>Cancel</Link>
    </div>
    {error && <p className="form-error rounded-md p-3">{error}</p>}
    {message && <p className="form-success rounded-md p-3">{message}</p>}
    <form className="report-form" onSubmit={submit}>
      <div className="form-grid grid gap-4 md:grid-cols-2">
        <label>Report Title<input required name="title" value={form.title} onChange={update} /></label>
        <label>Related Case<select name="caseId" value={form.caseId} onChange={update}><option value="">No related case yet</option>{cases.map(item => <option key={item._id} value={item._id}>{item.caseNumber} - {item.title}</option>)}</select></label>
        <label>Incident Date<input required type="date" name="incidentDate" value={form.incidentDate} onChange={update} /></label>
        <label>Location<input name="location" value={form.location} onChange={update} /></label>
        <label>Source Reliability<small>How reliable the source is.</small><input required type="number" min="1" max="5" name="sourceReliability" value={form.sourceReliability} onChange={update} /></label>
        <label>Information Credibility<small>How believable or confirmed the information is.</small><input required type="number" min="1" max="5" name="informationCredibility" value={form.informationCredibility} onChange={update} /></label>
        <label className="wide-field md:col-span-2">Description<textarea required name="description" rows="5" value={form.description} onChange={update} /></label>
        <label className="wide-field md:col-span-2">Evidence Description<textarea name="evidenceDescription" rows="4" value={form.evidenceDescription} onChange={update} /></label>
      </div>
      <div className="form-actions"><button className="button" disabled={saving}>{saving ? 'Saving...' : edit ? 'Save Changes' : 'Create Report'}</button></div>
    </form>
  </section>
}
