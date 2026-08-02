import { useEffect, useMemo, useState } from 'react'
import { getAlerts, updateAlertStatus } from '../api/cases'

const labels = { high: 'High', critical: 'Critical', High: 'High', Critical: 'Critical' }

function AlertTable({ alerts, onStatus }) {
  return <div className="table-wrap overflow-x-auto"><table><thead><tr><th>TITLE</th><th>CASE NUMBER</th><th>THREAT LEVEL</th><th>STATUS</th><th>CREATED</th><th>ACTIONS</th></tr></thead><tbody>{alerts.map(alert => <tr key={alert._id}><td><b>{alert.title}</b></td><td>{alert.caseNumber}</td><td><span className={'badge ' + alert.threatLevel.toLowerCase()}>{labels[alert.threatLevel] || alert.threatLevel}</span></td><td>{alert.status}</td><td>{new Date(alert.createdAt).toLocaleDateString()}</td><td className="report-actions">{alert.status === 'New' && <button onClick={() => onStatus(alert._id, 'Acknowledged')}>Acknowledge</button>}{alert.status !== 'Resolved' && <button onClick={() => onStatus(alert._id, 'Resolved')}>Resolve</button>}</td></tr>)}</tbody></table></div>
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const activeAlerts = useMemo(() => alerts.filter(alert => ['New', 'Acknowledged'].includes(alert.status)), [alerts])
  const resolvedAlerts = useMemo(() => alerts.filter(alert => alert.status === 'Resolved'), [alerts])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await getAlerts()
      setAlerts(Array.isArray(payload.alerts) ? payload.alerts : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const changeStatus = async (id, status) => {
    setError('')
    setMessage('')
    try {
      await updateAlertStatus(id, status)
      setMessage(`Alert ${status.toLowerCase()}.`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return <section className="content px-4 py-7 md:px-10 md:py-10">
    <p className="eyebrow">Sentinel workspace</p><h1>Alerts</h1><p className="muted">High-priority case alerts for your workspace.</p>
    {error && <p className="form-error rounded-md p-3">{error}</p>}
    {message && <p className="form-success rounded-md p-3">{message}</p>}
    <section className="case-section reports-list overflow-hidden"><h2>Active Alerts</h2>{loading ? <p className="muted">Loading alerts...</p> : error ? null : activeAlerts.length === 0 ? <p className="muted rounded-md border border-dashed border-slate-300 p-4">No active alerts.</p> : <AlertTable alerts={activeAlerts} onStatus={changeStatus} />}</section>
    <section className="case-section reports-list mt-5 overflow-hidden"><h2>Alert History</h2>{loading ? <p className="muted">Loading alert history...</p> : error ? null : resolvedAlerts.length === 0 ? <p className="muted rounded-md border border-dashed border-slate-300 p-4">No resolved alerts yet.</p> : <AlertTable alerts={resolvedAlerts} onStatus={changeStatus} />}</section>
  </section>
}
