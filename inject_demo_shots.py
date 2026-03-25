import psycopg2
import random
import math
from datetime import datetime, timezone, timedelta

def inject_demo_shots():
    db_config = {
        "host": "127.0.0.1",
        "port": 5432,
        "database": "kicksense",
        "user": "postgres",
        "password": "password123"
    }
    
    match_id = 1
    players_to_inject = [3, 7, 10] # Track IDs to give shots to
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        print("✅ Connected to database for demo injection")
        
        # 1. Clear existing shot data for these players to avoid duplicates
        pids_str = ",".join(map(str, players_to_inject))
        cursor.execute(f"DELETE FROM shot_events WHERE match_id = %s AND track_id IN ({pids_str})", (match_id,))
        
        start_ts = datetime.now(timezone.utc)
        
        for pid in players_to_inject:
            num_shots = random.randint(3, 8)
            team_id = 0 if pid % 2 == 0 else 1
            
            shots_total = 0
            shots_on_target = 0
            goals = 0
            max_power = 0.0
            total_dist = 0.0
            
            for i in range(num_shots):
                frame_idx = random.randint(100, 5000)
                # Random origin on a half-field
                x_origin = random.uniform(10, 45) if team_id == 0 else random.uniform(-45, -10)
                y_origin = random.uniform(-25, 25)
                
                dist = math.sqrt((52.5 - abs(x_origin))**2 + y_origin**2)
                power = random.uniform(15, 32)
                
                # Simple xG calc for demo
                theta = math.atan2(7.32, dist)
                xg = min(0.95, max(0.01, (theta / math.pi) * 2.0 * math.exp(-0.02 * dist)))
                
                is_on_target = random.random() < 0.6
                is_goal = is_on_target and (random.random() < 0.3 or xg > 0.4)
                
                cursor.execute("""
                    INSERT INTO shot_events 
                    (match_id, track_id, team_id, frame_idx, time, distance_m, angle_deg, power_ms, xg, is_on_target, is_goal, x_origin, y_origin)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    match_id, pid, team_id, frame_idx, 
                    start_ts + timedelta(seconds=frame_idx/30),
                    dist, random.uniform(0, 45), power, xg, is_on_target, is_goal, x_origin, y_origin
                ))
                
                shots_total += 1
                if is_on_target: shots_on_target += 1
                if is_goal: goals += 1
                max_power = max(max_power, power)
                total_dist += dist
                
            # Update player_match_stats
            accuracy = (shots_on_target / shots_total * 100) if shots_total > 0 else 0
            avg_dist = total_dist / shots_total if shots_total > 0 else 0
            
            cursor.execute("""
                UPDATE player_match_stats 
                SET shots_total = %s, shots_on_target = %s, goals = %s, 
                    shot_accuracy = %s, avg_shot_distance_m = %s, max_shot_power_ms = %s
                WHERE match_id = %s AND track_id = %s
            """, (shots_total, shots_on_target, goals, accuracy, avg_dist, max_power, match_id, pid))
            
            print(f"✅ Injected {num_shots} shots for Player {pid} (Team {team_id})")
            
        conn.commit()
        print("\n🎉 Injection complete! Refresh your dashboard and select Player 3, 7, or 10.")
        
    except Exception as e:
        print(f"❌ Injection failed: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    inject_demo_shots()
