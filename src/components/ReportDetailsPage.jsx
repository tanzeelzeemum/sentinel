import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteReport, getProfile, getReport } from '../api/cases'

function date(value) {
  return value ? new Date(value).toLocaleString() : '-'
}

function canEdit(role, report, email) {
  return role === 'admin' || (role === 'officer' && report.submittedByEmail === email)
}

const statusLabels = { unassigned: 'Unassigned', linked: 'Linked', reviewed: 'Reviewed' }

export default function ReportDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getReport(id), getProfile()])
      .then(([reportPayload, profilePayload]) => {
        setReport(reportPayload.report || null)
        setProfile(profilePayload.profile || null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const remove = async () => {
    if (!window.confirm(`Delete report "${report.title}"? This cannot be undone.`)) return
    try {
      await deleteReport(id)
      navigate('/reports', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <section className="content px-4 py-7 md:px-10"><p className="muted">Loading report...</p></section>
  if (error && !report) return <section className="content px-4 py-7 md:px-10"><p className="form-error rounded-md p-3">{error}</p></section>

  const allowed = canEdit(profile?.role, report, profile?.email)

  return <section className="content case-detail px-4 py-7 md:px-10 md:py-10">
    <div className="page-heading flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="eyebrow">Incident report</p><h1>{report.title}</h1><p className="muted">Related case: {report.caseId?.caseNumber || 'Unassigned'}</p></div>
      <div className="detail-actions">{allowed && <Link className="button" to={`/reports/${id}/edit`}>Edit</Link>}{allowed && <button className="delete-button" onClick={remove}>Delete</button>}</div>
    </div>
    {error && <p className="form-error rounded-md p-3">{error}</p>}
    <section className="detail-grid grid gap-4 md:grid-cols-3">
      <article><span>Related Case</span><b>{report.caseId?.caseNumber || 'Unassigned'}</b><small>{report.caseId?.title || 'No related case yet'}</small></article>
      <article><span>Status</span><b><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{statusLabels[report.status] || 'Unassigned'}</span></b></article>
      <article><span>Incident Date</span><b>{date(report.incidentDate)}</b></article>
      <article><span>Location</span><b>{report.location || '-'}</b></article>
      <article><span>Source Reliability</span><b>{report.sourceReliability}</b></article>
      <article><span>Information Credibility</span><b>{report.informationCredibility}</b></article>
      <article><span>Reporting Officer</span><b>{report.submittedBy?.name || report.submittedBy?.email || report.submittedByEmail}</b><small>{report.submittedBy?.email || report.submittedByEmail}</small></article>
      <article><span>Created</span><b>{date(report.createdAt)}</b></article>
      <article><span>Updated</span><b>{date(report.updatedAt)}</b></article>
    </section>
    <section className="case-section"><h2>Description</h2><p>{report.description}</p></section>
    <section className="case-section mt-4"><h2>Evidence Description</h2>{report.evidenceDescription ? <p>{report.evidenceDescription}</p> : <p className="muted">No evidence description provided.</p>}</section>
    {report.caseId && <p className="mt-4"><Link className="secondary-button" to={`/cases/${report.caseId?._id || report.caseId}`}>Open Related Case</Link></p>}
  </section>
}
