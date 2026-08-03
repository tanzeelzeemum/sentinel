import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate
} from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import {
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Shield,
  Users,
  X
} from 'lucide-react'

import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CasesPage from './components/CasesPage'
import ReportsPage from './components/ReportsPage'
import CaseFormPage from './components/CaseFormPage'
import CaseDetailsPage from './components/CaseDetailsPage'
import ReportFormPage from './components/ReportFormPage'
import ReportDetailsPage from './components/ReportDetailsPage'
import AlertsPage from './components/AlertsPage'
import ProfilePage from './components/ProfilePage'

import {
  getAlerts,
  getCases,
  getProfile,
  getReports
} from './api/cases'

import { auth } from './firebase'
import './styles.css'


function Logo() {
  return (
    <Link to="/" className="brand">
      <span>
        <Shield size={19} />
      </span>
      Sentinel
    </Link>
  )
}


function Landing() {
  return (
    <main className="landing">
      <nav className="public-nav">
        <Logo />

        <div className="public-links">
          <Link to="/">Home</Link>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <Link to="/login">Login</Link>

          <Link className="button small" to="/register">
            Create Account
          </Link>
        </div>
      </nav>

      <section className="hero" id="about">
        <p className="eyebrow">
          <Shield size={15} />
          Secure operations platform
        </p>

        <h1>
          Secure Intelligence
          <br />
          <em>Case Management</em>
        </h1>

        <p>
          Manage incidents, reports, alerts, and intelligence records through
          one secure academic demonstration platform.
        </p>

        <div className="hero-actions">
          <Link className="button" to="/register">
            Get Started
          </Link>
        </div>
      </section>

      <section className="feature-grid" id="features">
        <Feature
          icon={<LockKeyhole />}
          title="Secure Access"
          text="Protected authentication and controlled access for authorized users."
        />

        <Feature
          icon={<FileText />}
          title="Case Management"
          text="Create, review, update, and organize intelligence cases and reports."
        />

        <Feature
          icon={<Users />}
          title="Team Collaboration"
          text="Allow authorized users to collaborate on shared reports and alerts."
        />
      </section>
    </main>
  )
}


function Feature({ icon, title, text }) {
  return (
    <article>
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}


function AuthPage({ registerPage = false }) {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()

    console.log('Login form submitted')

    setError('')
    setBusy(true)

    try {
      const credential = registerPage
        ? await register(email.trim(), password)
        : await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          )

      console.log('Firebase login successful')
      console.log('User UID:', credential.user.uid)
      console.log('Navigating to dashboard')

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="loading-page">
        Checking secure access...
      </main>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Logo />

        <div className="auth-copy">
          <p className="eyebrow">
            Authorized access
          </p>

          <h1>
            {registerPage ? 'Create Account' : 'Login'}
          </h1>

          <p>
            {registerPage
              ? 'Create an account using your official email address.'
              : 'Login to your Sentinel workspace.'}
          </p>
        </div>

        <form onSubmit={submit}>
          <label>
            Email Address

            <input
              required
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label>
            Password

            <input
              required
              minLength="6"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="button"
          >
            {busy
              ? 'Please wait...'
              : registerPage
                ? 'Create Account'
                : 'Login'}
          </button>
        </form>

        {!registerPage && (
          <Link
            className="forgot-link"
            to="/forgot-password"
          >
            Forgot Password?
          </Link>
        )}

        <p className="auth-footer">
          {registerPage
            ? 'Already have an account?'
            : 'Need an account?'}

          {' '}

          <Link
            to={registerPage ? '/login' : '/register'}
          >
            {registerPage ? 'Login' : 'Create Account'}
          </Link>
        </p>
      </div>

      <aside>
        <Shield className="seal" size={42} />

        <h2>
          Secure
          <br />
          coordination.
        </h2>

        <p>
          Academic demonstration system for authorized users.
        </p>
      </aside>
    </main>
  )
}


function ForgotPassword() {
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()

    setMessage('')
    setError('')

    try {
      await forgotPassword(email)

      setMessage(
        'A password reset email has been sent.'
      )
    } catch {
      setError(
        'Unable to send a reset email. Check your Firebase settings.'
      )
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Logo />

        <div className="auth-copy">
          <p className="eyebrow">
            Account recovery
          </p>

          <h1>
            Reset Password
          </h1>

          <p>
            Enter your email address to receive a password reset link.
          </p>
        </div>

        <form onSubmit={submit}>
          <label>
            Email Address

            <input
              required
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {message && (
            <p className="form-success">
              {message}
            </p>
          )}

          <button className="button">
            Send Reset Link
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">
            Back to Login
          </Link>
        </p>
      </div>

      <aside>
        <Shield className="seal" size={42} />

        <h2>
          Account
          <br />
          recovery.
        </h2>
      </aside>
    </main>
  )
}


function Sidebar({ open, close, profile }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    [LayoutDashboard, 'Dashboard', '/dashboard'],
    [FileText, 'Cases', '/cases'],
    [ClipboardList, 'Reports', '/reports'],
    [Bell, 'Alerts', '/alerts'],
    [Users, 'Profile', '/profile']
  ]

  const handleLogout = async () => {
    await logout()

    close()

    navigate('/login', {
      replace: true
    })
  }

  return (
    <aside className={'sidebar ' + (open ? 'open' : '')}>
      <div className="side-head">
        <Logo />

        <button
          onClick={close}
          aria-label="Close menu"
        >
          <X />
        </button>
      </div>

      <p className="nav-label">
        Navigation
      </p>

      {links.map(([Icon, label, path]) => (
        <NavLink
          key={label}
          to={path}
          onClick={close}
          end
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}

      <div className="side-user">
        <b>
          {profile?.role || 'officer'}
        </b>

        <span>
          {profile?.email || ''}
        </span>
      </div>

      <button
        className="signout side-signout"
        onClick={handleLogout}
      >
        Logout
      </button>
    </aside>
  )
}


function DashboardLayout() {
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getProfile()
      .then(payload => {
        setProfile(payload.profile || null)
      })
      .catch(() => {
        setProfile(null)
      })
  }, [user])

  return (
    <main className="app-shell">
      <Sidebar
        open={open}
        close={() => setOpen(false)}
        profile={profile}
      />

      <div className="workspace">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <p>
            Sentinel
          </p>

          <div className="top-user">
            <b>
              {profile?.role || 'officer'}
            </b>

            <span>
              {profile?.email || user?.email}
            </span>
          </div>
        </header>

        <Outlet context={{ profile }} />
      </div>
    </main>
  )
}


const display = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
  open: 'Open',
  'under-review': 'Under review',
  resolved: 'Resolved',
  closed: 'Closed'
}


function Dashboard() {
  const [cases, setCases] = useState([])
  const [reports, setReports] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getCases(),
      getReports(),
      getAlerts()
    ])
      .then(
        ([
          casesPayload,
          reportsPayload,
          alertsPayload
        ]) => {
          setCases(
            Array.isArray(casesPayload.cases)
              ? casesPayload.cases
              : Array.isArray(casesPayload.data)
                ? casesPayload.data
                : []
          )

          setReports(
            Array.isArray(reportsPayload.reports)
              ? reportsPayload.reports
              : []
          )

          setAlerts(
            Array.isArray(alertsPayload.alerts)
              ? alertsPayload.alerts
              : []
          )
        }
      )
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const priority = cases.filter(item =>
    ['high', 'critical'].includes(item.threatLevel)
  )

  const recentCases = [...cases]
    .sort(
      (first, second) =>
        new Date(second.createdAt) -
        new Date(first.createdAt)
    )
    .slice(0, 5)

  const recentReports = [...reports]
    .sort(
      (first, second) =>
        new Date(second.createdAt) -
        new Date(first.createdAt)
    )
    .slice(0, 5)

  return (
    <section className="content px-4 py-7 md:px-10 md:py-10">
      <p className="eyebrow">
        Operational overview
      </p>

      <h1>
        Intelligence Dashboard
      </h1>

      <p className="muted">
        Live case, report, and alert activity for your workspace.
      </p>

      {error && (
        <p className="form-error rounded-md p-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">
          Loading dashboard...
        </p>
      ) : (
        <>
          <div className="stats grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Stat
              label="Total Cases"
              value={cases.length}
            />

            <Stat
              label="Active Cases"
              value={
                cases.filter(item =>
                  ['open', 'under-review'].includes(item.status)
                ).length
              }
            />

            <Stat
              label="Critical Alerts"
              value={
                alerts.filter(
                  alert =>
                    ['critical', 'Critical'].includes(
                      alert.threatLevel
                    ) &&
                    alert.status !== 'Resolved'
                ).length
              }
            />

            <Stat
              label="Open Cases"
              value={
                cases.filter(
                  item => item.status === 'open'
                ).length
              }
            />

            <Stat
              label="Total Reports"
              value={reports.length}
            />
          </div>

          <section className="case-section mb-5">
            <h2>
              Operational Workflow
            </h2>

            <div className="workflow-grid grid gap-3 md:grid-cols-4">
              <WorkflowStep
                title="Review Dashboard"
                text="Check current case, report, and alert activity."
              />

              <WorkflowStep
                title="Open or Create Case"
                text="Review authorized cases or start a new case."
                to="/cases"
              />

              <WorkflowStep
                title="Add Incident Report"
                text="Attach a fictional incident report to a case."
                to="/reports/new"
              />

              <WorkflowStep
                title="Review Threat and Alerts"
                text="Confirm high-priority alerts and assessment status."
                to="/alerts"
              />
            </div>
          </section>

          <section className="case-section">
            <h2>
              Priority Cases
            </h2>

            {priority.length === 0 ? (
              <p className="muted">
                No priority cases.
              </p>
            ) : (
              <CaseTable reports={priority} />
            )}
          </section>

          <section className="case-section dashboard-recent">
            <h2>
              Recent Cases
            </h2>

            {recentCases.length === 0 ? (
              <p className="muted">
                No cases created yet.
              </p>
            ) : (
              <CaseTable reports={recentCases} />
            )}
          </section>

          <section className="case-section dashboard-recent">
            <h2>
              Recent Reports
            </h2>

            {recentReports.length === 0 ? (
              <p className="muted">
                No reports created yet.
              </p>
            ) : (
              <ReportTable reports={recentReports} />
            )}
          </section>
        </>
      )}
    </section>
  )
}


function CaseTable({ reports }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>CASE</th>
            <th>THREAT LEVEL</th>
            <th>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {reports.map(report => (
            <tr key={report._id}>
              <td>
                <b>
                  {report.title}
                </b>

                <small>
                  {report.caseNumber}
                </small>
              </td>

              <td>
                <span
                  className={
                    'badge ' + report.threatLevel
                  }
                >
                  {display[report.threatLevel] ||
                    report.threatLevel}
                </span>
              </td>

              <td>
                {display[report.status] ||
                  report.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


function ReportTable({ reports }) {
  return (
    <div className="table-wrap overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>REPORT</th>
            <th>CASE</th>
            <th>INCIDENT DATE</th>
            <th>REPORTING OFFICER</th>
          </tr>
        </thead>

        <tbody>
          {reports.map(report => (
            <tr key={report._id}>
              <td>
                <b>
                  {report.title}
                </b>
              </td>

              <td>
                {report.caseId?.caseNumber
                  ? `${report.caseId.caseNumber} - ${report.caseId.title}`
                  : 'Unassigned'}
              </td>

              <td>
                {report.incidentDate
                  ? new Date(
                      report.incidentDate
                    ).toLocaleDateString()
                  : '-'}
              </td>

              <td>
                {report.submittedBy?.name ||
                  report.submittedBy?.email ||
                  report.submittedByEmail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


function WorkflowStep({ title, text, to }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mb-3 text-sm text-slate-500">
        {text}
      </p>

      {to && (
        <Link
          className="secondary-button inline-flex"
          to={to}
        >
          Open
        </Link>
      )}
    </article>
  )
}


function DashboardPage({ title, description }) {
  return (
    <section className="content">
      <p className="eyebrow">
        Sentinel workspace
      </p>

      <h1>
        {title}
      </h1>

      <p className="muted">
        {description}
      </p>

      <section className="case-section">
        <h2>
          {title} Overview
        </h2>

        <p className="muted">
          This section is ready for future data integration.
        </p>
      </section>
    </section>
  )
}


function Stat({ label, value }) {
  return (
    <article className="stat">
      <p>
        {label}
      </p>

      <strong>
        {value}
      </strong>
    </article>
  )
}


function Unauthorized() {
  return (
    <main className="not-found">
      <Logo />

      <h1>
        Unauthorized
      </h1>

      <h2>
        Access is restricted.
      </h2>

      <p>
        Please login with an authorized account.
      </p>

      <Link className="button" to="/login">
        Login
      </Link>
    </main>
  )
}


function NotFound() {
  return (
    <main className="not-found">
      <Logo />

      <h1>
        Page Not Found
      </h1>

      <h2>
        This page is unavailable.
      </h2>

      <p>
        Return to Sentinel to continue.
      </p>

      <Link className="button" to="/">
        Home
      </Link>
    </main>
  )
}


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/login"
        element={<AuthPage />}
      />

      <Route
        path="/register"
        element={<AuthPage registerPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/cases"
          element={<CasesPage />}
        />

        <Route
          path="/cases/new"
          element={<CaseFormPage />}
        />

        <Route
          path="/cases/:id"
          element={<CaseDetailsPage />}
        />

        <Route
          path="/cases/:id/edit"
          element={<CaseFormPage edit />}
        />

        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        <Route
          path="/reports/new"
          element={<ReportFormPage />}
        />

        <Route
          path="/reports/:id"
          element={<ReportDetailsPage />}
        />

        <Route
          path="/reports/:id/edit"
          element={<ReportFormPage edit />}
        />

        <Route
          path="/alerts"
          element={<AlertsPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />
      </Route>

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  )
}


createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)