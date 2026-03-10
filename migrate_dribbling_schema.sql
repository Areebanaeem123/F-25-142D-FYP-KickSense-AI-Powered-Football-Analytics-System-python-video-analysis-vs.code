-- Migration: Add dribbling columns to player_match_stats and create team_dribbling_stats table

-- Step 1: Add team_id column to player_match_stats if it doesn't exist
ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS team_id INT REFERENCES teams(team_id);

-- Step 2: Add dribbling columns to player_match_stats if they don't exist
ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS dribbles_attempted INT DEFAULT 0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS dribbles_successful INT DEFAULT 0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS dribble_success_rate DOUBLE PRECISION DEFAULT 0.0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS dribble_distance_m DOUBLE PRECISION DEFAULT 0.0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS progressive_dribbles INT DEFAULT 0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS avg_dribble_distance_m DOUBLE PRECISION DEFAULT 0.0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS avg_dribble_duration_s DOUBLE PRECISION DEFAULT 0.0;

ALTER TABLE player_match_stats
ADD COLUMN IF NOT EXISTS dribble_opponents_beaten INT DEFAULT 0;

-- Step 3: Create team_dribbling_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_dribbling_stats (
    match_id INT REFERENCES matches(match_id),
    team_id INT REFERENCES teams(team_id),
    total_dribbles INT DEFAULT 0,
    successful_dribbles INT DEFAULT 0,
    success_rate DOUBLE PRECISION DEFAULT 0.0,
    total_distance_m DOUBLE PRECISION DEFAULT 0.0,
    progressive_dribbles INT DEFAULT 0,
    avg_dribble_distance_m DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (match_id, team_id)
);

-- Step 4: Verify the schema
\d player_match_stats
\d team_dribbling_stats
