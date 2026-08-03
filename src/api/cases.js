import { auth } from '../firebase'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiRequest(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('You must be logged in.')

  const token = await user.getIdToken()
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    })
  } catch {
    throw new Error('Cannot reach the backend API. Make sure the server is running on port 5000.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) throw new Error(payload.message || 'Your login has expired. Please sign in again.')
    if (response.status === 403) throw new Error(payload.message || 'You are not authorized to perform this action.')
    if (response.status === 404) throw new Error(payload.message || 'The requested API route was not found.')
    if (response.status >= 500) throw new Error(payload.message || 'The backend server could not complete this request.')
    throw new Error(payload.message || payload.error || `API request failed with status ${response.status}`)
  }

  return payload
}

export const getCases = () => apiRequest('/api/cases')
export const getCasesWithFilters = filters => {
  const params = new URLSearchParams(Object.entries(filters || {}).filter(([, value]) => value))
  return apiRequest(`/api/cases${params.toString() ? `?${params}` : ''}`)
}
export const getCase = id => apiRequest(`/api/cases/${id}`)
export const createCase = caseFile => apiRequest('/api/cases', { method: 'POST', body: JSON.stringify(caseFile) })
export const updateCase = (id, caseFile) => apiRequest(`/api/cases/${id}`, { method: 'PUT', body: JSON.stringify(caseFile) })
export const deleteCase = id => apiRequest(`/api/cases/${id}`, { method: 'DELETE' })
export const updateCaseStatus = (id, status) => apiRequest(`/api/cases/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
export const assignOfficer = (id, assignedOfficer) => apiRequest(`/api/cases/${id}/assign`, { method: 'PUT', body: JSON.stringify({ assignedOfficer }) })
export const addCaseNote = (id, text) => apiRequest(`/api/cases/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) })
export const updateThreatAssessment = (id, assessment) => apiRequest(`/api/cases/${id}/threat-assessment`, { method: 'PUT', body: JSON.stringify(assessment) })
export const getCaseOfficers = () => apiRequest('/api/cases/meta/officers')
export const getAlerts = () => apiRequest('/api/alerts')
export const updateAlertStatus = (id, status) => apiRequest(`/api/alerts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
export const getReports = filters => {
  const params = new URLSearchParams(Object.entries(filters || {}).filter(([, value]) => value))
  return apiRequest(`/api/reports${params.toString() ? `?${params}` : ''}`)
}
export const getReport = id => apiRequest(`/api/reports/${id}`)
export const createReport = report => apiRequest('/api/reports', { method: 'POST', body: JSON.stringify(report) })
export const updateReport = (id, report) => apiRequest(`/api/reports/${id}`, { method: 'PUT', body: JSON.stringify(report) })
export const deleteReport = id => apiRequest(`/api/reports/${id}`, { method: 'DELETE' })
export const getProfile = () => apiRequest('/api/profile')
export const updateProfile = profile => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(profile) })
