import { Shield } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import '../../styles/modules.css'

export default function TeamCohesionIndex() {
  const cohesionData = [
    { name: 'Defensive Cohesion', value: 85 },
    { name: 'Midfield Connection', value: 78 },
    { name: 'Attacking Coordination', value: 82 },
  ]

  const COLORS = ['#1a4d2e', '#2d7a4f', '#ff6b35']

  const cohesionFactors = [
    { factor: 'Pass Completion Rate', score: 87, weight: 'High' },
    { factor: 'Positioning Index', score: 81, weight: 'High' },
    { factor: 'Off-ball Movement', score: 79, weight: 'Medium' },
    { factor: 'Defensive Coverage', score: 84, weight: 'High' },
    { factor: 'Transition Speed', score: 76, weight: 'Medium' },
    { factor: 'Set Piece Coordination', score: 88, weight: 'High' },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Shield size={24} />
          </span>
          Team Cohesion Index
        </h1>
        <p>Measure of team coordination and synchronization</p>
      </div>

      {/* Overall Score */}
      <div className="grid-3-col">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Overall Cohesion</span>
          </div>
          <div
            className="stat-card-value"
            style={{
              fontSize: '3rem',
              color: '#22c55e',
            }}
          >
            82%
          </div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Excellent team synchronization
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">vs Last Week</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--accent)' }}>
            +5%
          </div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Improving trend
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Trend</span>
          </div>
          <div className="stat-card-value">📈</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Strong positive momentum
          </p>
        </div>
      </div>

      {/* Cohesion Breakdown */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Cohesion Breakdown</h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cohesionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Factors */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Cohesion Factors</h2>
        </div>

        <div className="player-list">
          {cohesionFactors.map((item, index) => (
            <div key={index} className="player-item">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: `rgba(26, 77, 46, 0.15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: '700',
                }}
              >
                {Math.round((item.score * index) / 100) + 1}
              </div>
              <div className="player-info" style={{ flex: 1 }}>
                <div className="player-name">{item.factor}</div>
                <div className="player-position" style={{ fontSize: '0.8rem' }}>
                  Weight: {item.weight}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '150px',
                    height: '6px',
                    background: 'var(--gray-200)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)`,
                      width: `${item.score}%`,
                    }}
                  ></div>
                </div>
                <span style={{ fontWeight: '600', color: 'var(--primary)', minWidth: '40px' }}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Recommendations</h2>
        </div>

        <div className="grid-2">
          <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
            <h4 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Strengths</h4>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', lineHeight: '1.8' }}>
              <li>Excellent set piece coordination (88%)</li>
              <li>Strong defensive alignment (84%)</li>
              <li>Efficient passing network</li>
            </ul>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Areas to Improve</h4>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', lineHeight: '1.8' }}>
              <li>Transition speed (76%)</li>
              <li>Counter-attack coordination</li>
              <li>Pressing triggers consistency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
