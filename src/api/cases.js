import { auth } from '../firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
export const createCase = report => apiRequest('/api/cases', { method: 'POST', body: JSON.stringify(report) })
export const updateCase = (id, report) => apiRequest(`/api/cases/${id}`, { method: 'PUT', body: JSON.stringify(report) })
export const deleteCase = id => apiRequest(`/api/cases/${id}`, { method: 'DELETE' })
export const getAlerts = () => apiRequest('/api/alerts')
export const updateAlertStatus = (id, status) => apiRequest(`/api/alerts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
export const getProfile = () => apiRequest('/api/profile')
export const updateProfile = profile => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(profile) })
