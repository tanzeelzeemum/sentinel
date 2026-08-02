import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { deleteReport, getProfile, getReports } from '../api/cases'

const statusLabels = { unassigned: 'Unassigned', linked: 'Linked', reviewed: 'Reviewed' }

function date(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function canCreate(role) {
  return role === 'admin' || role === 'officer'
}

function canEdit(role, report, email) {
  return role === 'admin' || (role === 'officer' && report.submittedByEmail === email)
}

function reportStatus(report) {
  if (report.caseId && report.status !== 'reviewed') return 'linked'
  return report.status || 'unassigned'
}

function relatedCase(report) {
  return report.caseId?.caseNumber ? `${report.caseId.caseNumber} - ${report.caseId.title || 'Untitled case'}` : 'Unassigned'
}

function StatusBadge({ report }) {
  const status = reportStatus(report)
  const tone = status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : status === 'linked' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{statusLabels[status] || 'Unassigned'}</span>
}

function Rating({ label, value }) {
  return <span className="whitespace-nowrap">{label}: {value || '-'}/5</span>
}

function ReportActions({ report, profile, onDelete }) {
  const allowed = canEdit(profile?.role, report, profile?.email)
  return <div className="flex items-center gap-3 whitespace-nowrap">
    <Link className="inline-flex items-center gap-1 text-teal-700" to={`/reports/${report._id}`}><Eye size={16} />View</Link>
    {allowed && <Link className="inline-flex items-center gap-1 text-teal-700" to={`/reports/${report._id}/edit`}><Pencil size={16} />Edit</Link>}
    {allowed && <button className="delete-button inline-flex items-center gap-1" onClick={() => onDelete(report)}><Trash2 size={16} />Delete</button>}
  </div>
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [profile, setProfile] = useState(null)
  const [filters, setFilters] = useState({ search: '', reliability: '', credibility: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const role = profile?.role || 'officer'

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [reportPayload, profilePayload] = await Promise.all([getReports(filters), getProfile()])
      setReports(Array.isArray(reportPayload.reports) ? reportPayload.reports : [])
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

  const remove = async report => {
    if (!window.confirm(`Delete report "${report.title}"? This cannot be undone.`)) return
    setError('')
    setMessage('')
    try {
      await deleteReport(report._id)
      setMessage('Report deleted.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return <section className="content reports-page px-4 py-7 md:px-10 md:py-10">
    <div className="page-heading flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="eyebrow">Incident reporting</p><h1>Reports</h1><p className="muted">Create and review MongoDB-backed incident reports linked to cases.</p></div>
      {canCreate(role) && <Link className="button inline-flex items-center gap-2" to="/reports/new"><FilePlus2 size={17} />Add Report</Link>}
    </div>
    {error && <p className="form-error rounded-md p-3">{error}</p>}
    {message && <p className="form-success rounded-md p-3">{message}</p>}
    <form className="filters grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]" onSubmit={submitFilters}>
      <label>Search<input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Title or description" /></label>
      <label>Source Reliability<select value={filters.reliability} onChange={e => setFilters({ ...filters, reliability: e.target.value })}><option value="">Any</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Information Credibility<select value={filters.credibility} onChange={e => setFilters({ ...filters, credibility: e.target.value })}><option value="">Any</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <button className="secondary-button">Apply</button>
    </form>
    <section className="case-section reports-list overflow-hidden">
      <h2>Incident Reports</h2>
      {loading ? <p className="muted">Loading reports...</p> : error ? null : reports.length === 0 ? <p className="muted rounded-md border border-dashed border-slate-300 p-4">No incident reports match the current filters.</p> : <>
        <div className="hidden overflow-x-auto md:block">
          <table className="report-table min-w-[1280px] table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[210px]" />
              <col className="w-[190px]" />
              <col className="w-[110px]" />
              <col className="w-[120px]" />
              <col className="w-[150px]" />
              <col className="w-[125px]" />
              <col className="w-[145px]" />
              <col className="w-[190px]" />
              <col className="w-[110px]" />
              <col className="w-[145px]" />
            </colgroup>
            <thead>
              <tr>
                {['Report Title', 'Related Case', 'Status', 'Incident Date', 'Location', 'Source Reliability', 'Information Credibility', 'Reporting Officer', 'Created', 'Actions'].map(header => <th className="px-3 py-3 text-left align-bottom" key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>{reports.map(report => <tr key={report._id}>
              <td className="px-3 py-4 align-top"><b className="break-words">{report.title || 'Untitled report'}</b></td>
              <td className="px-3 py-4 align-top"><span className="break-words">{relatedCase(report)}</span></td>
              <td className="px-3 py-4 align-top"><StatusBadge report={report} /></td>
              <td className="whitespace-nowrap px-3 py-4 align-top">{date(report.incidentDate)}</td>
              <td className="px-3 py-4 align-top"><span className="break-words">{report.location || '-'}</span></td>
              <td className="px-3 py-4 align-top"><Rating label="Source" value={report.sourceReliability} /></td>
              <td className="px-3 py-4 align-top"><Rating label="Credibility" value={report.informationCredibility} /></td>
              <td className="px-3 py-4 align-top"><span className="block max-w-[170px] break-all">{report.submittedBy?.name || report.submittedBy?.email || report.submittedByEmail || '-'}</span></td>
              <td className="whitespace-nowrap px-3 py-4 align-top">{date(report.createdAt)}</td>
              <td className="px-3 py-4 align-top"><ReportActions report={report} profile={profile} onDelete={remove} /></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="grid gap-4 md:hidden">
          {reports.map(report => <article className="rounded-md border border-slate-200 bg-white p-4" key={report._id}>
            <div className="mb-3 flex items-start justify-between gap-3"><h3 className="text-base font-bold text-slate-800">{report.title || 'Untitled report'}</h3><StatusBadge report={report} /></div>
            <dl className="grid gap-2 text-sm text-slate-600">
              <div><dt className="font-bold text-slate-500">Related Case</dt><dd>{relatedCase(report)}</dd></div>
              <div><dt className="font-bold text-slate-500">Incident Date</dt><dd>{date(report.incidentDate)}</dd></div>
              <div><dt className="font-bold text-slate-500">Location</dt><dd>{report.location || '-'}</dd></div>
              <div><dt className="font-bold text-slate-500">Reliability</dt><dd><Rating label="Source" value={report.sourceReliability} /> · <Rating label="Credibility" value={report.informationCredibility} /></dd></div>
              <div><dt className="font-bold text-slate-500">Reporting Officer</dt><dd className="break-all">{report.submittedBy?.name || report.submittedBy?.email || report.submittedByEmail || '-'}</dd></div>
            </dl>
            <div className="mt-4"><ReportActions report={report} profile={profile} onDelete={remove} /></div>
          </article>)}
        </div>
      </>}
    </section>
  </section>
}
