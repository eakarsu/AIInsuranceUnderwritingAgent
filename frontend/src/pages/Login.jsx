import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAutoFill = () => {
    setEmail('admin@insuranceai.com')
    setPassword('admin123')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div className="icon">&#x1F6E1;</div>
          <h1>InsurAI Platform</h1>
          <p>AI-Powered Insurance Underwriting Agent</p>
        </div>

        <button className="btn-auto-fill" onClick={handleAutoFill}>
          &#x26A1; Quick Login — Auto-fill Credentials
        </button>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@insuranceai.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
