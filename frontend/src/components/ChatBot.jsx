import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api'

const suggestions = [
  'Open AI Center',
  'Show overdue billing items',
  'Create a follow-up endorsement task for policy changes',
  'Summarize fraud alerts',
]

export default function ChatBot({ pageContext }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask me to open pages, inspect sidebar data, or prepare create/update/delete actions. Data changes require confirmation before I run them.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(text = input) {
    const message = text.trim()
    if (!message || loading) return

    const nextMessages = [...messages, { role: 'user', content: message }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await apiPost('/chatbot/message', {
        message,
        history: nextMessages,
        page_context: pageContext,
      })

      if (response?.error) {
        setMessages([...nextMessages, { role: 'assistant', content: response.error, error: true }])
      } else {
        if (response.navigate_path) navigate(response.navigate_path)
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: response.answer || 'I could not produce an answer.',
            highlights: response.highlights || [],
            followUps: response.follow_up_questions || [],
            usedApi: response.used_api,
            pendingAction: response.pending_action,
            navigatePath: response.navigate_path,
          },
        ])
      }
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: err.message || 'Chat request failed.', error: true }])
    }
    setLoading(false)
  }

  async function executeAction(action) {
    if (!action || loading) return
    const confirmMessage = {
      role: 'user',
      content: `Confirm ${action.method} ${action.endpoint}${action.id ? `/${action.id}` : ''}`,
    }
    const nextMessages = [...messages, confirmMessage]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const response = await apiPost('/chatbot/execute', { action })
      if (response?.error) {
        setMessages([...nextMessages, { role: 'assistant', content: response.error, error: true }])
      } else {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: response.answer || 'Action completed.',
            highlights: response.highlights || [],
            usedApi: response.used_api,
          },
        ])
      }
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: err.message || 'Action failed.', error: true }])
    }
    setLoading(false)
  }

  function actionLabel(action) {
    if (!action) return ''
    const id = action.id ? `/${action.id}` : ''
    return `${action.method} ${action.endpoint}${id}`
  }

  return (
    <div className={`chatbot ${open ? 'open' : ''}`}>
      {open && (
        <section className="chatbot-panel" aria-label="API chatbot">
          <div className="chatbot-header">
            <div>
              <strong>API Assistant</strong>
              <small>Dynamic sidebar API context</small>
            </div>
            <button type="button" onClick={() => setOpen(false)}>x</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chatbot-message ${message.role} ${message.error ? 'error' : ''}`}>
                <p>{message.content}</p>
                {message.usedApi && <span className="chatbot-api">Used API: {message.usedApi}</span>}
                {message.navigatePath && <span className="chatbot-api">Opened: {message.navigatePath}</span>}
                {message.highlights?.length > 0 && (
                  <ul>
                    {message.highlights.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                  </ul>
                )}
                {message.pendingAction && (
                  <div className="chatbot-action">
                    <strong>Pending control action</strong>
                    <span>{actionLabel(message.pendingAction)}</span>
                    {Object.keys(message.pendingAction.body || {}).length > 0 && (
                      <pre>{JSON.stringify(message.pendingAction.body, null, 2)}</pre>
                    )}
                    <button type="button" onClick={() => executeAction(message.pendingAction)} disabled={loading}>
                      Confirm Action
                    </button>
                  </div>
                )}
                {message.followUps?.length > 0 && (
                  <div className="chatbot-followups">
                    {message.followUps.slice(0, 3).map((item) => (
                      <button key={item} type="button" onClick={() => send(item)}>{item}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="chatbot-message assistant"><p>Checking app APIs...</p></div>}
          </div>

          <div className="chatbot-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => send(suggestion)} disabled={loading}>{suggestion}</button>
            ))}
          </div>

          <form className="chatbot-input" onSubmit={(event) => { event.preventDefault(); send() }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about policies, claims, renewals, billing..."
            />
            <button type="submit" disabled={loading || !input.trim()}>Send</button>
          </form>
        </section>
      )}

      <button className="chatbot-toggle" type="button" onClick={() => setOpen(!open)}>
        AI
      </button>
    </div>
  )
}
