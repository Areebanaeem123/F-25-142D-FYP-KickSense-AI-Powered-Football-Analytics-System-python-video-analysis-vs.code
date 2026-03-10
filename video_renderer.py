import cv2
import numpy as np
from Tracking import draw_ellipse, CLASS_COLORS

class VideoRenderer:
    """Handles video rendering with overlays and annotations"""
    
    def __init__(self, video_path, output_path, display_size=(900, 600)):
        self.video_path = video_path
        self.output_path = output_path
        self.display_size = display_size
        
        self.team_colors = [
            (0, 255, 255),   # Team 0 - yellow/cyan
            (255, 140, 0),   # Team 1 - orange
            (0, 200, 255),   # fallback extra
        ]
        
        # Video properties (will be set during render)
        self.cap = None
        self.out = None
        self.fps = None
        self.width = None
        self.height = None
    
    @staticmethod
    def draw_triangle_for_ball(frame, bbox, color):
        """Draw a triangle above the ball"""
        try:
            x1, y1, x2, y2 = bbox
            x_center = int((x1 + x2) / 2)
            y_top = int(y1)
            triangle_size = 15
            pt1 = (x_center, y_top - triangle_size - 5)
            pt2 = (x_center - triangle_size, y_top - 5)
            pt3 = (x_center + triangle_size, y_top - 5)
            triangle_points = np.array([pt1, pt2, pt3], np.int32)
            cv2.fillPoly(frame, [triangle_points], color)
            cv2.polylines(frame, [triangle_points], True, (255, 255, 255), 2)
        except Exception as e:
            print(f"⚠️ draw_triangle_for_ball error: {e}")
        return frame
    
    def draw_legend(self, frame):
        """Draw the legend on the frame"""
        legend_y = 70
        legend_items = [
            ("Ball", CLASS_COLORS[0]),
            ("Goalkeeper", CLASS_COLORS[1]),
            ("Player", CLASS_COLORS[2]),
            ("Referee", CLASS_COLORS[3])
        ]
        
        legend_height = len(legend_items) * 30 + 10
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 60), (150, 60 + legend_height), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        
        for label, color in legend_items:
            if label == "Ball":
                triangle_center_y = legend_y
                triangle_size = 8
                pt1 = (30, triangle_center_y - triangle_size)
                pt2 = (30 - triangle_size, triangle_center_y + triangle_size)
                pt3 = (30 + triangle_size, triangle_center_y + triangle_size)
                triangle_points = np.array([pt1, pt2, pt3], np.int32)
                cv2.fillPoly(frame, [triangle_points], color)
                cv2.polylines(frame, [triangle_points], True, (255, 255, 255), 1)
            else:
                cv2.circle(frame, (30, legend_y), 8, color, -1)
                cv2.circle(frame, (30, legend_y), 8, (255, 255, 255), 1)
            cv2.putText(frame, label, (50, legend_y + 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            legend_y += 30
    
    def render_video(self, tracks, track_class_map, camera_movement_per_frame, 
                     fps, width, height, total_frames, 
                     cohesion_analyzer=None, cohesion_timeline=None):
        """Render video with all overlays"""
        print("\n🎨 Rendering video with overlays...")
        
        self.fps = fps
        self.width = width
        self.height = height
        
        # Convert timeline lists to dict for O(1) lookup: frame -> score
        # team_0: { frame_idx: score, ... }
        cohesion_map = {'team_0': {}, 'team_1': {}}
        if cohesion_timeline:
            for team_name in ['team_0', 'team_1']:
                if team_name in cohesion_timeline:
                    for f, s in cohesion_timeline[team_name]:
                        cohesion_map[team_name][f] = s
        
        self.cap = cv2.VideoCapture(self.video_path)
        if not self.cap.isOpened():
            raise RuntimeError(f"Could not open video: {self.video_path}")
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.out = cv2.VideoWriter(self.output_path, fourcc, fps, (width, height))
        
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        frame_idx = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame = frame.copy()
            
            # Draw tracked players
            for object_name in ["goalkeepers", "players", "referees"]:
                if object_name in tracks and frame_idx in tracks[object_name]:
                    for track_id, track_info in tracks[object_name][frame_idx].items():
                        bbox = track_info['bbox']
                        x1, y1, x2, y2 = bbox
                        
                        # Determine color
                        cls = track_class_map.get(track_id, 2)
                        color = CLASS_COLORS.get(cls, (255, 180, 120))
                        
                        # Draw ellipse
                        draw_ellipse(frame, (x1, y1, x2, y2), color, track_id)
                        
                        # Team label
                        team_id = track_info.get('team_id')
                        if team_id is not None:
                            team_color = self.team_colors[team_id % len(self.team_colors)]
                            label = f"T{team_id + 1}"
                            label_bg = (x1, max(0, y1 - 18))
                            cv2.rectangle(frame, label_bg, 
                                        (label_bg[0] + 30, label_bg[1] + 18), 
                                        team_color, -1)
                            cv2.putText(frame, label, (label_bg[0] + 4, label_bg[1] + 13),
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
                        
                        # Ball possession indicator
                        if track_info.get('has_ball'):
                            indicator_pos = (x1 + 12, max(10, y1 - 12))
                            cv2.circle(frame, indicator_pos, 10, (0, 165, 255), -1)
                            cv2.putText(frame, "BALL", 
                                       (indicator_pos[0] - 15, indicator_pos[1] - 15),
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 2)
                        
                        # Speed and distance
                        if 'speed' in track_info and 'distance' in track_info:
                            speed = track_info['speed']
                            distance = track_info['distance']
                            
                            # Cap unrealistic speeds
                            if speed > 45:
                                speed = 0
                            
                            if speed > 0:
                                position = list(track_info['position'])
                                position[1] += 40
                                position = tuple(map(int, position))
                                cv2.putText(frame, f"{speed:.1f} km/h", position,
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 2)
                                cv2.putText(frame, f"{distance:.1f} m",
                                           (position[0], position[1] + 20),
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 2)
            
            # Draw ball
            if "ball" in tracks and frame_idx in tracks["ball"]:
                for ball_id, ball_info in tracks["ball"][frame_idx].items():
                    self.draw_triangle_for_ball(frame, ball_info['bbox'], CLASS_COLORS[0])
            
            # --- Draw Cohesion Analysis ---
            if cohesion_analyzer:
                # Need pixel positions for current frame for each team
                team_0_pixels = []
                team_1_pixels = []
                
                if "players" in tracks and frame_idx in tracks["players"]:
                    for tid, tinfo in tracks["players"][frame_idx].items():
                         # We need bbox to get foot position in pixels
                         if 'bbox' in tinfo and 'team_id' in tinfo:
                             # Use bottom center of bbox as player position
                             x1, y1, x2, y2 = tinfo['bbox']
                             cx, cy = int((x1 + x2)/2), int(y2)
                             
                             if tinfo['team_id'] == 0:
                                 team_0_pixels.append((cx, cy))
                             elif tinfo['team_id'] == 1:
                                 team_1_pixels.append((cx, cy))
                
                # Retrieve pre-calculated scores for this frame
                score_0 = cohesion_map['team_0'].get(frame_idx)
                score_1 = cohesion_map['team_1'].get(frame_idx)
                
                if score_0 is not None:
                     frame = cohesion_analyzer.visualize_cohesion(
                         frame, team_0_pixels, score_0, self.team_colors[0]
                     )
                if score_1 is not None:
                     frame = cohesion_analyzer.visualize_cohesion(
                         frame, team_1_pixels, score_1, self.team_colors[1]
                     )
            # ------------------------------
            
            # Frame counter
            cv2.rectangle(frame, (10, 10), (400, 50), (0, 0, 0), -1)
            cv2.putText(frame, f"Frame: {frame_idx}/{total_frames}",
                       (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Camera movement info
            camera_dx, camera_dy = camera_movement_per_frame[frame_idx]
            info_x, info_y = 10, height - 60
            overlay = frame.copy()
            cv2.rectangle(overlay, (info_x, info_y), 
                         (info_x + 300, info_y + 50), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
            cv2.putText(frame, f"Camera X: {camera_dx:.1f}px", 
                       (info_x + 10, info_y + 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            cv2.putText(frame, f"Camera Y: {camera_dy:.1f}px", 
                       (info_x + 10, info_y + 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Legend
            self.draw_legend(frame)
            
            # Mode indicator
            cv2.putText(frame, "Pixel Approximation Mode", 
                       (width - 300, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 2)
            
            # Write and display
            self.out.write(frame)
            frame_display = cv2.resize(frame, self.display_size)
            cv2.imshow("Advanced Player Tracking", frame_display)
            
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
            
            if frame_idx % 100 == 0:
                print(f"Rendering frame {frame_idx}/{total_frames}")
            
            frame_idx += 1
        
        self.cap.release()
        self.out.release()
        cv2.destroyAllWindows()
        print(f"✅ Video saved to: {self.output_path}")