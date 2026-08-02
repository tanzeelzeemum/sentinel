import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../api/cases'

const blank = { fullName: '', role: '', department: '', organization: '' }
export default function ProfilePage() {
  const { user } = useAuth(); const [form, setForm] = useState(blank); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  useEffect(() => { getProfile().then(payload => setForm({ ...blank, ...(payload.profile || {}) })).catch(err => setError(err.message)).finally(() => setLoading(false)) }, [])
  const submit = async event => { event.preventDefault(); setSaving(true); setError(''); setMessage(''); try { const payload = await updateProfile(form); setForm({ ...blank, ...(payload.profile || {}) }); setMessage('Profile saved.') } catch (err) { setError(err.message) } finally { setSaving(false) } }
  return <section className="content"><p className="eyebrow">Sentinel workspace</p><h1>Profile</h1><p className="muted">Manage your account information.</p>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}{loading ? <p className="muted">Loading profile...</p> : <form className="report-form" onSubmit={submit}><div className="form-grid"><label>Email Address<input value={user?.email || ''} readOnly /></label><label>Full Name<input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label><label>Role<input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></label><label>Department<input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></label><label className="wide-field">Organization<input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></label></div><div className="form-actions"><button className="button" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button></div></form>}</section>
}
