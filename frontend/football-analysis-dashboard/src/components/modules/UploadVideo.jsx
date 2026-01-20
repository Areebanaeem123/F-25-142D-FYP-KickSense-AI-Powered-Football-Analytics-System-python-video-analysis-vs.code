'use client';

import { useState } from 'react'
import { Upload, Video, CheckCircle } from 'lucide-react'
import '../../styles/modules.css'

export default function UploadVideo() {
  const [uploadedVideos, setUploadedVideos] = useState([
    {
      id: 1,
      name: 'Match vs Arsenal - Full Game',
      date: '2024-01-20',
      duration: '90:00',
      size: '2.4 GB',
      status: 'Analyzed',
      progress: 100,
    },
    {
      id: 2,
      name: 'Training Session - Tactical Drills',
      date: '2024-01-18',
      duration: '45:30',
      size: '1.2 GB',
      status: 'Analyzing',
      progress: 75,
    },
  ])

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    // Handle file drop
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Upload size={24} />
          </span>
          Upload Video
        </h1>
        <p>Upload match or training videos for AI-powered analysis</p>
      </div>

      <div className="upload-container">
        {/* Upload Area */}
        <div className="content-card">
          <div
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="upload-area-icon">📹</div>
            <div className="upload-area-text">
              <h3>Drag and drop your video here</h3>
              <p>or click to select file from your computer</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                Supported formats: MP4, AVI, MOV (Max 5GB)
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Videos */}
        {uploadedVideos.length > 0 && (
          <div className="content-card">
            <div className="content-card-header">
              <h2 className="content-card-title">Uploaded Videos</h2>
            </div>

            <div className="upload-files">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="upload-file">
                  <div className="upload-file-info">
                    <div className="upload-file-icon">
                      <Video size={24} />
                    </div>
                    <div>
                      <div className="upload-file-details">
                        <h4>{video.name}</h4>
                        <div className="upload-file-size">
                          {video.duration} • {video.size}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        Uploaded: {video.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="upload-file-progress">
                      <div
                        className="upload-file-progress-bar"
                        style={{ width: `${video.progress}%` }}
                      ></div>
                    </div>
                    <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>
                      {video.progress}%
                    </span>
                    {video.status === 'Analyzed' && (
                      <CheckCircle size={24} color="#22c55e" style={{ marginLeft: '0.5rem' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Info */}
        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">What We Analyze</h2>
          </div>

          <div className="grid-3-col">
            <div className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Player Tracking</h4>
              <p>Track player movements, positioning, and distance covered throughout the match.</p>
            </div>
            <div className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Ball Possession</h4>
              <p>Analyze ball control, possession percentage, and passing patterns.</p>
            </div>
            <div className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Performance Metrics</h4>
              <p>Generate detailed performance reports with actionable insights.</p>
            </div>
            <div className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Tactical Analysis</h4>
              <p>Evaluate team formation, tactics, and strategic movements.</p>
            </div>
            <div className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Injury Prevention</h4>
              <p>Identify risky movements and potential injury-prone situations.</p>
            </div>
            <div className="stat-card">
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>AI Insights</h4>
              <p>Get AI-powered recommendations for team improvement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
