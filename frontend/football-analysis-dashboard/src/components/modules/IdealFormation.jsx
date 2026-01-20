import { Grid } from 'lucide-react'
import '../../styles/modules.css'

export default function IdealFormation() {
  const formations = [
    {
      id: 1,
      name: '4-3-3',
      efficiency: 92,
      description: 'Balanced formation for both defense and attack',
      recommended: true,
      positions: {
        defenders: 4,
        midfielders: 3,
        forwards: 3,
      },
      pros: ['Strong defense', 'Flexible midfield', 'Quick transitions'],
      cons: ['Can be overrun in midfield'],
    },
    {
      id: 2,
      name: '3-5-2',
      efficiency: 87,
      description: 'Attacking formation with wing support',
      recommended: false,
      positions: {
        defenders: 3,
        midfielders: 5,
        forwards: 2,
      },
      pros: ['Numerical midfield advantage', 'Wide coverage'],
      cons: ['Exposed defensively'],
    },
    {
      id: 3,
      name: '5-3-2',
      efficiency: 78,
      description: 'Defensive formation for challenging matches',
      recommended: false,
      positions: {
        defenders: 5,
        midfielders: 3,
        forwards: 2,
      },
      pros: ['Very solid defense', 'Controlled possession'],
      cons: ['Limited attacking options'],
    },
  ]

  const currentLineup = [
    { position: 'GK', player: 'Ryan Thompson', number: 1 },
    { position: 'LB', player: 'Samuel Davis', number: 3 },
    { position: 'CB', player: 'Marcus Johnson', number: 5 },
    { position: 'CB', player: 'Thomas Brown', number: 6 },
    { position: 'RB', player: 'Lucas Martinez', number: 2 },
    { position: 'LM', player: 'James Wilson', number: 8 },
    { position: 'CM', player: 'David Miller', number: 10 },
    { position: 'RM', player: 'Christopher Lee', number: 7 },
    { position: 'LF', player: 'John Anderson', number: 9 },
    { position: 'CF', player: 'Alex Wilson', number: 11 },
    { position: 'RF', player: 'Brandon Taylor', number: 14 },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Grid size={24} />
          </span>
          Ideal Formation
        </h1>
        <p>AI-recommended optimal formation based on squad analysis</p>
      </div>

      {/* Formations Comparison */}
      <div className="grid-3-col">
        {formations.map((formation) => (
          <div
            key={formation.id}
            className="stat-card"
            style={{
              border: formation.recommended ? '2px solid var(--accent)' : '1px solid rgba(26, 77, 46, 0.2)',
              position: 'relative',
            }}
          >
            {formation.recommended && (
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
                  color: 'white',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                ⭐ Recommended
              </div>
            )}
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', marginTop: formation.recommended ? '1.5rem' : 0 }}>
              {formation.name}
            </h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {formation.description}
            </p>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--accent)',
                marginBottom: '0.5rem',
              }}
            >
              {formation.efficiency}%
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Efficiency Rating</p>
          </div>
        ))}
      </div>

      {/* Current Lineup */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Current 4-3-3 Lineup</h2>
        </div>

        <div className="formation-visual">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/football-formation.jpg"
              alt="Formation Diagram"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '12px',
              }}
            />
          </div>

          <div className="grid-3-col">
            {currentLineup.map((player, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  background: 'rgba(26, 77, 46, 0.1)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    margin: '0 auto 0.5rem',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1.2rem',
                  }}
                >
                  {player.number}
                </div>
                <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.9rem' }}>
                  {player.position}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>
                  {player.player}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formation Analysis */}
      <div className="grid-2">
        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">Recommended Formation Details</h2>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Formation: 4-3-3</h4>
              <p style={{ color: 'var(--gray-600)' }}>
                This formation provides the best balance for your squad composition and tactical objectives.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Advantages:</h5>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', lineHeight: '1.8' }}>
                <li>Solid defensive foundation with 4 defenders</li>
                <li>Flexible midfield control</li>
                <li>Attacking prowess with 3 forwards</li>
              </ul>
            </div>

            <div>
              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Key Players:</h5>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', lineHeight: '1.8' }}>
                <li>David Miller (CM) - Central control</li>
                <li>John Anderson (LF) - Creative play</li>
                <li>Marcus Johnson (CB) - Defensive stability</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">Alternative Options</h2>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div
              style={{
                padding: '1rem',
                background: 'rgba(255, 107, 53, 0.1)',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--accent)' }}>
                Switch to 3-5-2
              </h5>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                When facing aggressive opponents
              </p>
              <button className="btn btn-outline-accent" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                View Option
              </button>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'rgba(26, 77, 46, 0.1)',
                borderRadius: '8px',
              }}
            >
              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                Defensive Setup 5-3-2
              </h5>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                For high-risk matches
              </p>
              <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                View Option
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
