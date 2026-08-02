import { useEffect, useState } from 'react'
import { getAlerts, updateAlertStatus } from '../api/cases'

const labels = { high: 'High', critical: 'Critical', High: 'High', Critical: 'Critical' }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  const load = async () => { setLoading(true); setError(''); try { const payload = await getAlerts(); setAlerts(Array.isArray(payload.alerts) ? payload.alerts : []) } catch (err) { setError(err.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const changeStatus = async (id, status) => { setError(''); setMessage(''); try { await updateAlertStatus(id, status); setMessage(`Alert ${status.toLowerCase()}.`); await load() } catch (err) { setError(err.message) } }
  return <section className="content"><p className="eyebrow">Sentinel workspace</p><h1>Alerts</h1><p className="muted">High-priority case alerts for your workspace.</p>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<section className="case-section reports-list"><h2>Active Alerts</h2>{loading ? <p className="muted">Loading alerts...</p> : error ? null : alerts.length === 0 ? <p className="muted">No active alerts.</p> : <div className="table-wrap"><table><thead><tr><th>TITLE</th><th>CASE NUMBER</th><th>THREAT LEVEL</th><th>STATUS</th><th>CREATED</th><th>ACTIONS</th></tr></thead><tbody>{alerts.map(alert => <tr key={alert._id}><td><b>{alert.title}</b></td><td>{alert.caseNumber}</td><td><span className={'badge ' + alert.threatLevel.toLowerCase()}>{labels[alert.threatLevel] || alert.threatLevel}</span></td><td>{alert.status}</td><td>{new Date(alert.createdAt).toLocaleDateString()}</td><td className="report-actions">{alert.status === 'New' && <button onClick={() => changeStatus(alert._id, 'Acknowledged')}>Acknowledge</button>}{alert.status !== 'Resolved' && <button onClick={() => changeStatus(alert._id, 'Resolved')}>Resolve</button>}</td></tr>)}</tbody></table></div>}</section></section>
}
