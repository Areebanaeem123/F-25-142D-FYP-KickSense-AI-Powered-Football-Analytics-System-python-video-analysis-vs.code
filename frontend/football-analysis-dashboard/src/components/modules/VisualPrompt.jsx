'use client';

import { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import '../../styles/modules.css'

export default function VisualPrompt() {
  const [prompt, setPrompt] = useState('')
  const [responses, setResponses] = useState([
    {
      id: 1,
      prompt: 'Analyze our defensive weakness against wing attacks',
      response: `Our team shows 34% vulnerability on the wings, particularly against fast wingers. Key issues:
1. Full-backs pushed too high (avg 72% up-field)
2. Center-back cover inadequate (avg 1.2m gap)
3. Midfield support delayed by 0.8s

Recommendation: Shift full-backs 8m deeper initially, improve midfield positioning 1s before possession loss.`,
      timestamp: '5 minutes ago',
    },
    {
      id: 2,
      prompt: 'What changes would improve our set piece defense?',
      response: `Set piece analysis shows 67% success against us (7/10 goals conceded from set pieces).
Identified problems:
- Zoning assignments unclear
- Communication gaps at 15-18m mark
- Goalkeeper positioning inconsistent

Solutions:
1. Implement 5-man zoning system
2. Add communication protocols
3. Pre-training goalkeeper drills (15 mins daily)`,
      timestamp: '12 minutes ago',
    },
  ])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const newResponse = {
      id: responses.length + 1,
      prompt: prompt,
      response: `AI Analysis: Based on your question about "${prompt}", here are the insights from our analysis systems:

This is a simulated AI response. In production, this would connect to real video analysis and AI models to provide:
1. Tactical recommendations based on match footage
2. Player performance correlation
3. Opposition pattern matching
4. Training prescription recommendations

The system would analyze key performance indicators and provide actionable insights for team improvement.`,
      timestamp: 'just now',
    }

    setResponses([newResponse, ...responses])
    setPrompt('')
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Sparkles size={24} />
          </span>
          Visual Prompt Analytics
        </h1>
        <p>AI-powered analysis through natural language queries</p>
      </div>

      {/* Input Section */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Ask AI Analytics Questions</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
            }}
          >
            <input
              type="text"
              placeholder="Ask about tactics, player performance, formations, etc..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: '2px solid var(--gray-300)',
                borderRadius: '10px',
                fontSize: '1rem',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
              }}
            >
              <Send size={18} />
              <span style={{ display: 'none' }}>Send</span>
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(26, 77, 46, 0.08)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--gray-600)',
          }}
        >
          💡 Try asking: "Why is our pass accuracy dropping in the second half?" or "Which formation would work better
          against aggressive pressing?"
        </div>
      </div>

      {/* Responses Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {responses.map((item) => (
          <div key={item.id} className="content-card">
            <div
              style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--gray-200)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  align: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>❓</span>
                <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                  {item.prompt}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--gray-500)',
                }}
              >
                {item.timestamp}
              </span>
            </div>

            <div
              style={{
                background: 'rgba(26, 77, 46, 0.08)',
                padding: '1.25rem',
                borderRadius: '10px',
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.2rem', marginTop: '0.1rem' }}>🤖</span>
                <div>
                  <p style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)', lineHeight: '1.6' }}>
                    {item.response}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Helpful Query Examples</h2>
        </div>

        <div className="grid-2">
          {[
            {
              category: 'Tactical Questions',
              examples: [
                'Analyze our midfield control issues',
                'Why are we losing possession in the wings?',
                'How to improve defensive transitions?',
              ],
            },
            {
              category: 'Player Analysis',
              examples: [
                'Which player is underperforming?',
                'Who would best replace this player?',
                'Analyze player fitness levels',
              ],
            },
            {
              category: 'Formation & Strategy',
              examples: [
                'What formation suits our squad?',
                'How should we counter their style?',
                'Optimal substitution timing',
              ],
            },
            {
              category: 'Performance Metrics',
              examples: [
                'Where do we lose most balls?',
                'What\'s our biggest weakness?',
                'Compare performance vs last match',
              ],
            },
          ].map((group, idx) => (
            <div key={idx} className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                {group.category}
              </h4>
              <ul
                style={{
                  paddingLeft: '1.5rem',
                  color: 'var(--gray-600)',
                  fontSize: '0.9rem',
                  lineHeight: '1.8',
                }}
              >
                {group.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
