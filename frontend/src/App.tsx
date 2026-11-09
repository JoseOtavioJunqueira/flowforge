import { useEffect, useState } from 'react'
import './App.css'

type ApiState = 'checking' | 'online' | 'offline'

function App() {
  const [api, setApi] = useState<ApiState>('checking')

  // Calls the NestJS backend (GET /api) to show the whole stack is wired up.
  useEffect(() => {
    fetch('/api')
      .then((res) => setApi(res.ok ? 'online' : 'offline'))
      .catch(() => setApi('offline'))
  }, [])

  return (
    <main className="ff">
      <span className="ff-badge">Early-stage project</span>
      <h1>FlowForge</h1>
      <p className="ff-lead">
        Workflow orchestration for individuals and teams: compose workflows from
        steps (tasks, forms, approvals, waits) and track runs and metrics per
        workspace.
      </p>

      <ul className="ff-status">
        <li>
          <span className={`dot ${api}`} />
          NestJS API: <strong>{api}</strong>
        </li>
        <li>
          <span className="dot online" />
          Auth: register / login with JWT (bcrypt-hashed passwords)
        </li>
        <li>
          <span className="dot planned" />
          PostgreSQL schema + Row Level Security: designed
        </li>
        <li>
          <span className="dot planned" />
          Workflows, runs and metrics modules: planned
        </li>
      </ul>

      <a
        className="ff-link"
        href="https://github.com/JoseOtavioJunqueira/flowforge"
        target="_blank"
        rel="noopener noreferrer"
      >
        View source on GitHub
      </a>
    </main>
  )
}

export default App
