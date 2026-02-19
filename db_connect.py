import psycopg2
from psycopg2.extras import execute_values

class KicksenseDB:
    def __init__(self, db_config):
        try:
            self.conn = psycopg2.connect(**db_config)
            self.cursor = self.conn.cursor()
            print("✅ Connected to TimescaleDB")
        except Exception as e:
            print(f"❌ Connection Failed: {e}")
            self.conn = None
            
        self.buffer = []
        self.BATCH_SIZE = 500  # Write 500 rows at a time
    
    def ensure_tables(self):
        """
        Ensure runtime analytics tables exist.
        This complements init_db.sql and also supports existing DB volumes.
        """
        if not self.conn:
            return
        query = """
            CREATE EXTENSION IF NOT EXISTS timescaledb;

            CREATE TABLE IF NOT EXISTS teams (
                team_id INT PRIMARY KEY,
                name VARCHAR(50)
            );

            CREATE TABLE IF NOT EXISTS matches (
                match_id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                date TIMESTAMPTZ DEFAULT NOW(),
                fps INT DEFAULT 30
            );

            INSERT INTO teams (team_id, name) VALUES (0, 'Team A')
            ON CONFLICT (team_id) DO NOTHING;

            INSERT INTO teams (team_id, name) VALUES (1, 'Team B')
            ON CONFLICT (team_id) DO NOTHING;

            INSERT INTO matches (match_id, name, fps) VALUES (1, 'Test Match', 30)
            ON CONFLICT (match_id) DO NOTHING;

            CREATE TABLE IF NOT EXISTS tracking_data (
                time TIMESTAMPTZ NOT NULL,
                match_id INT REFERENCES matches(match_id),
                track_id INT,
                team_id INT REFERENCES teams(team_id),
                x_coord DOUBLE PRECISION,
                y_coord DOUBLE PRECISION,
                speed DOUBLE PRECISION,
                is_sprinting BOOLEAN
            );

            SELECT create_hypertable('tracking_data', 'time', if_not_exists => TRUE);

            CREATE TABLE IF NOT EXISTS player_match_stats (
                match_id INT REFERENCES matches(match_id),
                track_id INT NOT NULL,
                class VARCHAR(20),
                max_speed_kmh DOUBLE PRECISION,
                avg_speed_kmh DOUBLE PRECISION,
                total_distance_m DOUBLE PRECISION,
                foul_risk DOUBLE PRECISION,
                yellow_likelihood DOUBLE PRECISION,
                red_likelihood DOUBLE PRECISION,
                card_prediction VARCHAR(20),
                contact_events INT,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (match_id, track_id)
            );
        """
        try:
            self.cursor.execute(query)
            self.conn.commit()
        except Exception as e:
            print(f"❌ Failed to ensure player_match_stats table: {e}")
            self.conn.rollback()

    def clear_match_data(self, match_id=1):
        """Clear existing rows for a match so reruns don't duplicate data."""
        if not self.conn:
            return
        try:
            self.cursor.execute("DELETE FROM tracking_data WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM player_match_stats WHERE match_id = %s", (match_id,))
            self.conn.commit()
        except Exception as e:
            print(f"❌ Failed clearing match data: {e}")
            self.conn.rollback()

    def add_frame_data(self, timestamp, detections, match_id=1):
        """
        detections = list of tuples:
        (track_id, team_id, x, y, speed_ms, is_sprinting)
        """
        if not self.conn: return

        for det in detections:
            track_id, team_id, x, y, speed, is_sprinting = det
            
            # Map standard track info to DB columns
            # Ensure team_id is valid (0 or 1), default to 0
            safe_team_id = team_id if team_id in [0, 1] else 0

            self.buffer.append((
                timestamp, 
                match_id, 
                track_id, 
                safe_team_id, 
                x, 
                y, 
                speed, 
                is_sprinting
            ))

        # Flush if buffer is full
        if len(self.buffer) >= self.BATCH_SIZE:
            self.flush()

    def flush(self):
        if not self.buffer or not self.conn: return
        
        query = """
            INSERT INTO tracking_data 
            (time, match_id, track_id, team_id, x_coord, y_coord, speed, is_sprinting)
            VALUES %s
        """
        try:
            execute_values(self.cursor, query, self.buffer)
            self.conn.commit()
            self.buffer = [] 
        except Exception as e:
            print(f"❌ Database Insert Error: {e}")
            self.conn.rollback()

    def upsert_player_stats(self, player_stats, foul_risk_map=None, match_id=1):
        """
        Upsert aggregated per-player metrics.
        player_stats items are expected from export_stats_to_csv return payload.
        """
        if not self.conn or not player_stats:
            return
        rows = []
        for item in player_stats:
            tid = int(item["track_id"])
            foul = (foul_risk_map or {}).get(tid, {})
            rows.append((
                match_id,
                tid,
                item.get("class"),
                float(item.get("max_speed_kmh", 0.0)),
                float(item.get("avg_speed_kmh", 0.0)),
                float(item.get("total_distance_m", 0.0)),
                float(foul.get("foul_risk")) if foul.get("foul_risk") is not None else None,
                float(foul.get("yellow_likelihood")) if foul.get("yellow_likelihood") is not None else None,
                float(foul.get("red_likelihood")) if foul.get("red_likelihood") is not None else None,
                foul.get("card_prediction"),
                int(foul.get("contact_events", 0)) if foul else 0,
            ))
        query = """
            INSERT INTO player_match_stats
            (
                match_id, track_id, class, max_speed_kmh, avg_speed_kmh, total_distance_m,
                foul_risk, yellow_likelihood, red_likelihood, card_prediction, contact_events
            )
            VALUES %s
            ON CONFLICT (match_id, track_id)
            DO UPDATE SET
                class = EXCLUDED.class,
                max_speed_kmh = EXCLUDED.max_speed_kmh,
                avg_speed_kmh = EXCLUDED.avg_speed_kmh,
                total_distance_m = EXCLUDED.total_distance_m,
                foul_risk = EXCLUDED.foul_risk,
                yellow_likelihood = EXCLUDED.yellow_likelihood,
                red_likelihood = EXCLUDED.red_likelihood,
                card_prediction = EXCLUDED.card_prediction,
                contact_events = EXCLUDED.contact_events,
                updated_at = NOW()
        """
        try:
            execute_values(self.cursor, query, rows)
            self.conn.commit()
        except Exception as e:
            print(f"❌ Failed to upsert player stats: {e}")
            self.conn.rollback()

    def close(self):
        self.flush() # Save whatever is left
        if self.conn:
            self.conn.close()
            print("🔌 Database Disconnected")
