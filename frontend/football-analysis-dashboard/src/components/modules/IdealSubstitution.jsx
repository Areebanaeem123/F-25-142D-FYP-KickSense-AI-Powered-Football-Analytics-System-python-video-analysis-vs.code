import { Target } from 'lucide-react'
import '../../styles/modules.css'

export default function IdealSubstitution() {
  const substitutionOptions = [
    {
      id: 1,
      minute: 65,
      playerOut: 'James Wilson (LM)',
      playerIn: 'Christopher Lee (LM)',
      reason: 'Fatigue Management',
      impact: '+8% Passing Accuracy',
      priority: 'High',
    },
    {
      id: 2,
      minute: 72,
      playerOut: 'Brandon Taylor (RF)',
      playerIn: 'Kevin Garcia (RF)',
      reason: 'Tactical Adjustment',
      impact: '+6% Defensive Coverage',
      priority: 'Medium',
    },
    {
      id: 3,
      minute: 80,
      playerOut: 'David Miller (CM)',
      playerIn: 'Michael Chen (CM)',
      reason: 'Game Control',
      impact: '+4% Possession',
      priority: 'Low',
    },
  ]

  const benchPlayers = [
    { id: 1, name: 'Kevin Garcia', position: 'RF', rating: 7.8, status: 'Ready' },
    { id: 2, name: 'Michael Chen', position: 'CM', rating: 7.5, status: 'Ready' },
    { id: 3, name: 'Daniel Smith', position: 'ST', rating: 7.9, status: 'Ready' },
    { id: 4, name: 'Pablo Rodriguez', position: 'LB', rating: 7.2, status: 'Ready' },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Target size={24} />
          </span>
          Ideal Substitution
        </h1>
        <p>AI-recommended player substitutions for optimal performance</p>
      </div>

      {/* Recommended Substitutions */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Recommended Substitutions</h2>
        </div>

        <div className="player-list">
          {substitutionOptions.map((sub) => (
            <div key={sub.id} className="player-item">
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.2rem',
                }}
              >
                {sub.minute}'
              </div>

              <div className="player-info" style={{ flex: 1 }}>
                <div className="player-name">
                  {sub.playerOut} → {sub.playerIn}
                </div>
                <div className="player-position">{sub.reason}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: 'var(--gray-600)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Expected Impact
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {sub.impact}
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    background: sub.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : sub.priority === 'Medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    color: sub.priority === 'High' ? '#ef4444' : sub.priority === 'Medium' ? '#eab308' : '#6b7280',
                  }}
                >
                  {sub.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bench Players */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Bench Players Ready</h2>
        </div>

        <div className="grid-2">
          {benchPlayers.map((player) => (
            <div key={player.id} className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>
                    {player.name}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                    {player.position}
                  </p>
                </div>
                <span
                  className="badge badge-success"
                  style={{
                    fontSize: '0.8rem',
                  }}
                >
                  {player.status}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>
                  Player Rating
                </span>
                <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem' }}>
                  {player.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Substitution Strategy */}
      <div className="grid-2">
        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">Strategy Analysis</h2>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(26, 77, 46, 0.1) 0%, rgba(26, 77, 46, 0.05) 100%)',
                borderRadius: '8px',
              }}
            >
              <h5 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: '600' }}>
                Fatigue Management
              </h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Players showing signs of fatigue should be rotated in the 60-70 minute window.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)',
                borderRadius: '8px',
              }}
            >
              <h5 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: '600' }}>
                Tactical Adjustments
              </h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Consider adjustments based on match flow and opponent adjustments.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                borderRadius: '8px',
              }}
            >
              <h5 style={{ color: '#22c55e', marginBottom: '0.5rem', fontWeight: '600' }}>
                Game Control
              </h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Fresh legs in crucial positions help maintain control in final stages.
              </p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">Player Form Status</h2>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                  James Wilson (LM)
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Fatigue: High
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--gray-200)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#ef4444',
                    width: '85%',
                  }}
                ></div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                  David Miller (CM)
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Fatigue: Medium
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--gray-200)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#eab308',
                    width: '60%',
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                  Ryan Thompson (GK)
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Fatigue: Low
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--gray-200)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#22c55e',
                    width: '30%',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
