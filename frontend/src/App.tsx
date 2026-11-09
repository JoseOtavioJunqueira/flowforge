import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type StepType = 'task' | 'form' | 'approval' | 'wait'
interface Step {
  id?: string
  type: StepType
  name: string
}
interface Workflow {
  id: string
  name: string
  description: string
  steps: Required<Step>[]
}
interface RunStep {
  stepId: string
  name: string
  type: StepType
  status: 'succeeded' | 'failed'
  durationMs: number
}
interface Run {
  id: string
  workflowId: string
  workflowName: string
  status: 'succeeded' | 'failed'
  startedAt: string
  durationMs: number
  steps: RunStep[]
}
interface Metrics {
  workflows: number
  runs: number
  successRate: number | null
  avgDurationMs: number | null
}

const TOKEN_KEY = 'flowforge.token'
const EMAIL_KEY = 'flowforge.email'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function api<T>(
  path: string,
  token: string | null,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new ApiError(res.status, msg ?? `Request failed (${res.status})`)
  }
  return data as T
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const fmtMs = (ms: number | null) =>
  ms == null ? '-' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`

function Auth({ onAuth }: { onAuth: (token: string, email: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await api<{ accessToken: string }>(`/auth/${mode}`, null, {
        method: 'POST',
        body: { email, password },
      })
      onAuth(r.accessToken, email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  // Creates a throwaway account so visitors can try the app in one click.
  const demo = async () => {
    setBusy(true)
    setError('')
    try {
      const mail = `demo-${Math.random().toString(36).slice(2, 8)}@flowforge.dev`
      const r = await api<{ accessToken: string }>('/auth/register', null, {
        method: 'POST',
        body: { email: mail, password: 'demo-password' },
      })
      onAuth(r.accessToken, mail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="brand" style={{ justifyContent: 'center', marginBottom: 6 }}>
        <i /> FlowForge
      </div>
      <p className="lead">
        Build workflows from steps (tasks, forms, approvals, waits), run them and track the
        results.
      </p>
      <div className="card">
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={busy}>
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="alt">
          {mode === 'register' ? 'Already have an account? ' : 'New here? '}
          <button
            className="link"
            type="button"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? 'Sign in' : 'Create one'}
          </button>
        </p>
        <div className="sep">or</div>
        <button className="btn" type="button" disabled={busy} onClick={demo}>
          Try it now (demo account)
        </button>
      </div>
    </div>
  )
}

function StepChips({ steps, results }: { steps: Step[]; results?: RunStep[] }) {
  return (
    <div className="steps">
      {steps.map((s, i) => {
        const r = results?.[i]
        return (
          <span key={s.id ?? i} className="steps" style={{ gap: 6 }}>
            <span className={`step ${r?.status ?? ''}`}>
              <b>{s.type}</b> {s.name}
              {r && <small>{fmtMs(r.durationMs)}</small>}
            </span>
            {i < steps.length - 1 && <span className="arrow">→</span>}
          </span>
        )
      })}
    </div>
  )
}

function Dashboard({
  token,
  email,
  onLogout,
}: {
  token: string
  email: string
  onLogout: (reason?: string) => void
}) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState<string | null>(null)
  const [shown, setShown] = useState<{ wfId: string; steps: RunStep[]; run: Run | null }>()

  // form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [stepType, setStepType] = useState<StepType>('task')
  const [stepName, setStepName] = useState('')

  const guard = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        onLogout('Your session expired. Please sign in again.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    },
    [onLogout],
  )

  const refresh = useCallback(async () => {
    try {
      const [w, r, m] = await Promise.all([
        api<Workflow[]>('/workflows', token),
        api<Run[]>('/runs', token),
        api<Metrics>('/metrics', token),
      ])
      setWorkflows(w)
      setRuns(r)
      setMetrics(m)
    } catch (err) {
      guard(err)
    }
  }, [token, guard])

  useEffect(() => {
    let alive = true
    Promise.all([
      api<Workflow[]>('/workflows', token),
      api<Run[]>('/runs', token),
      api<Metrics>('/metrics', token),
    ])
      .then(([w, r, m]) => {
        if (!alive) return
        setWorkflows(w)
        setRuns(r)
        setMetrics(m)
      })
      .catch((err) => {
        if (alive) guard(err)
      })
    return () => {
      alive = false
    }
  }, [token, guard])

  const addStep = () => {
    if (!stepName.trim()) return
    setSteps([...steps, { type: stepType, name: stepName.trim() }])
    setStepName('')
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api('/workflows', token, { method: 'POST', body: { name, description, steps } })
      setName('')
      setDescription('')
      setSteps([])
      await refresh()
    } catch (err) {
      guard(err)
    }
  }

  const run = async (wf: Workflow) => {
    setRunning(wf.id)
    setShown({ wfId: wf.id, steps: [], run: null })
    setError('')
    try {
      const result = await api<Run>(`/workflows/${wf.id}/runs`, token, { method: 'POST' })
      // Replay the steps one by one so the execution is visible.
      for (let i = 1; i <= result.steps.length; i++) {
        await sleep(450)
        setShown({ wfId: wf.id, steps: result.steps.slice(0, i), run: null })
      }
      setShown({ wfId: wf.id, steps: result.steps, run: result })
      await refresh()
    } catch (err) {
      guard(err)
    } finally {
      setRunning(null)
    }
  }

  const remove = async (id: string) => {
    try {
      await api(`/workflows/${id}`, token, { method: 'DELETE' })
      if (shown?.wfId === id) setShown(undefined)
      await refresh()
    } catch (err) {
      guard(err)
    }
  }

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <i /> FlowForge
        </div>
        <div className="who">
          {email}
          <button className="btn small" onClick={() => onLogout()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>Workflows</span>
          <strong>{metrics?.workflows ?? '-'}</strong>
        </div>
        <div className="metric">
          <span>Runs</span>
          <strong>{metrics?.runs ?? '-'}</strong>
        </div>
        <div className="metric">
          <span>Success rate</span>
          <strong>{metrics?.successRate == null ? '-' : `${metrics.successRate}%`}</strong>
        </div>
        <div className="metric">
          <span>Avg duration</span>
          <strong>{fmtMs(metrics?.avgDurationMs ?? null)}</strong>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        <div className="stack">
          <div className="section-title">
            <h2>Workflows</h2>
          </div>
          {workflows.map((wf) => (
            <div className="card wf" key={wf.id}>
              <h3>{wf.name}</h3>
              {wf.description && <p>{wf.description}</p>}
              <StepChips steps={wf.steps} />
              {shown?.wfId === wf.id && (
                <div className="runbox">
                  <header>
                    <span>Execution</span>
                    {shown.run ? (
                      <span className={shown.run.status === 'succeeded' ? 'ok' : 'bad'}>
                        {shown.run.status} · {fmtMs(shown.run.durationMs)}
                      </span>
                    ) : (
                      <span className="arrow">running…</span>
                    )}
                  </header>
                  <StepChips steps={wf.steps.slice(0, Math.max(shown.steps.length, 1))} results={shown.steps} />
                </div>
              )}
              <div className="actions">
                <button
                  className="btn primary small"
                  disabled={running !== null}
                  onClick={() => run(wf)}
                >
                  {running === wf.id ? 'Running…' : 'Run'}
                </button>
                <button className="btn danger small" disabled={running !== null} onClick={() => remove(wf.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {workflows.length === 0 && <p className="empty">No workflows yet. Create one on the right.</p>}
        </div>

        <div className="stack">
          <div className="card">
            <div className="section-title">
              <h2>New workflow</h2>
            </div>
            <form className="form" onSubmit={create}>
              <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="stepform">
                <select value={stepType} onChange={(e) => setStepType(e.target.value as StepType)}>
                  <option value="task">task</option>
                  <option value="form">form</option>
                  <option value="approval">approval</option>
                  <option value="wait">wait</option>
                </select>
                <input
                  placeholder="Step name"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addStep()
                    }
                  }}
                />
                <button type="button" className="btn" onClick={addStep}>
                  Add step
                </button>
              </div>
              <ul className="pending">
                {steps.map((s, i) => (
                  <li key={i}>
                    <span>
                      {i + 1}. <b style={{ color: 'var(--accent)' }}>{s.type}</b> {s.name}
                    </span>
                    <button type="button" className="link" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                      remove
                    </button>
                  </li>
                ))}
              </ul>
              <button className="btn primary" disabled={steps.length === 0 || !name.trim()}>
                Create workflow
              </button>
            </form>
          </div>

          <div className="card">
            <div className="section-title">
              <h2>Recent runs</h2>
            </div>
            {runs.length === 0 ? (
              <p className="empty">Run a workflow to see its history here.</p>
            ) : (
              <ul className="runs">
                {runs.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <span>
                      {r.workflowName}{' '}
                      <span className={r.status === 'succeeded' ? 'ok' : 'bad'}>{r.status}</span>
                    </span>
                    <small>{fmtMs(r.durationMs)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="note">
        Demo build: data is kept in memory and may reset. The PostgreSQL schema with Row Level Security is
        designed in the repo.
      </p>
    </div>
  )
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) ?? '')
  const [notice, setNotice] = useState('')

  const logout = useCallback((reason?: string) => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setToken(null)
    setNotice(reason ?? '')
  }, [])

  if (!token) {
    return (
      <div className="shell">
        {notice && <p className="error" style={{ textAlign: 'center' }}>{notice}</p>}
        <Auth
          onAuth={(t, mail) => {
            localStorage.setItem(TOKEN_KEY, t)
            localStorage.setItem(EMAIL_KEY, mail)
            setEmail(mail)
            setNotice('')
            setToken(t)
          }}
        />
      </div>
    )
  }
  return <Dashboard token={token} email={email} onLogout={logout} />
}

export default App
