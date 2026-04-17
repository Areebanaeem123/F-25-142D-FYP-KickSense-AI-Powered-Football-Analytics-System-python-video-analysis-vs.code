-- Migration: Add Passing Accuracy feature schema
-- Run this against existing DB volumes that were initialized before this feature.
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS guards).

-- 1. Add passing columns to player_match_stats
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS passes_attempted INT DEFAULT 0;
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS passes_completed INT DEFAULT 0;
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS pass_accuracy DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS avg_pass_distance_m DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS progressive_passes INT DEFAULT 0;

-- Also ensure sub_priority column exists (added in a previous migration)
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS sub_priority DOUBLE PRECISION DEFAULT 0.0;

-- 2. Create pass_events table
CREATE TABLE IF NOT EXISTS pass_events (
    pass_id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(match_id),
    passer_id INT,
    receiver_id INT,
    passer_team INT REFERENCES teams(team_id),
    receiver_team INT,
    frame_idx INT,
    time TIMESTAMPTZ,
    distance_m DOUBLE PRECISION,
    is_completed BOOLEAN,
    is_progressive BOOLEAN,
    x_origin DOUBLE PRECISION,
    y_origin DOUBLE PRECISION,
    x_target DOUBLE PRECISION,
    y_target DOUBLE PRECISION,
    trajectory JSONB
);

-- 3. Create team_passing_stats table
CREATE TABLE IF NOT EXISTS team_passing_stats (
    match_id INT REFERENCES matches(match_id),
    team_id INT REFERENCES teams(team_id),
    total_passes INT DEFAULT 0,
    completed_passes INT DEFAULT 0,
    pass_accuracy DOUBLE PRECISION DEFAULT 0.0,
    total_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
    progressive_passes INT DEFAULT 0,
    avg_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (match_id, team_id)
);
