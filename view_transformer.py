import cv2
import numpy as np

class ViewTransformer:
    def __init__(self, target_width=105, target_height=68):
        # 1. Target World Dimensions (Meters)
        self.target_width = target_width
        self.target_height = target_height
        
        # 2. Source Points from Video (YOU MUST CHANGE THESE TO MATCH YOUR VIDEO)
        # Order: Bottom-Left, Bottom-Right, Top-Right, Top-Left
        # Use a tool like https://www.image-map.net/ to find these pixel x,y values on a screenshot
        self.pixel_vertices = np.array([
            [120, 950],   # Bottom-Left
            [1800, 950],  # Bottom-Right
            [1400, 150],  # Top-Right
            [520, 150]    # Top-Left
        ], dtype=np.float32)

        # 3. Target Points (Top-Down Map in Meters)
        self.target_vertices = np.array([
            [0, target_height],           # Bottom-Left (0, 68)
            [target_width, target_height], # Bottom-Right (105, 68)
            [target_width, 0],             # Top-Right (105, 0)
            [0, 0]                         # Top-Left (0, 0)
        ], dtype=np.float32)

        # 4. Compute the Matrix once
        self.perspective_transformer = cv2.getPerspectiveTransform(
            self.pixel_vertices, self.target_vertices
        )

    def transform_point(self, point):
        """Convert a single (x, y) pixel point to meters"""
        p = (int(point[0]), int(point[1]))
        
        # Optional: Check if point is inside the pitch (polygon test)
        is_inside = cv2.pointPolygonTest(self.pixel_vertices, p, False) >= 0
        if not is_inside:
            return None 

        reshaped_point = np.array([[point]], dtype=np.float32)
        transformed_point = cv2.perspectiveTransform(reshaped_point, self.perspective_transformer)
        return transformed_point[0][0]

    def add_transformed_position_to_tracks(self, tracks):
        """Iterate over all tracks and add 'position_transformed' (Meters)"""
        for object_name, object_tracks in tracks.items():
            # ERROR WAS HERE: Changed 'enumerate(object_tracks)' to 'object_tracks.items()'
            for frame_num, frame_tracks in object_tracks.items():
                for track_id, track_info in frame_tracks.items():
                    
                    # Safety check: ensure track_info is actually a dictionary
                    if not isinstance(track_info, dict) or 'bbox' not in track_info:
                        continue

                    bbox = track_info['bbox']
                    # Use the bottom center of the bbox (the feet)
                    foot_position = (bbox[0] + bbox[2]) / 2, bbox[3]
                    
                    # Transform
                    position_meters = self.transform_point(foot_position)
                    
                    if position_meters is not None:
                        tracks[object_name][frame_num][track_id]['position_transformed'] = position_meters.tolist()