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

    def close(self):
        self.flush() # Save whatever is left
        if self.conn:
            self.conn.close()
            print("🔌 Database Disconnected")