import pickle
import cv2
import numpy as np
import os

# Module-level constants
MINIMUM_DISTANCE = 5
LK_PARAMS = dict(
    winSize=(15, 15),
    maxLevel=2,
    criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
)


def _get_features_params(frame):
    """Get features detection parameters based on frame"""
    first_frame_grayscale = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mask_features = np.zeros_like(first_frame_grayscale)
    mask_features[:, 0:20] = 1
    mask_features[:, 900:1050] = 1
    features = dict(
        maxCorners=100,
        qualityLevel=0.3,
        minDistance=3,
        blockSize=7,
        mask=mask_features
    )
    return features


def _measure_distance(p1, p2):
    """Measure Euclidean distance between two points"""
    return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)**0.5


def _measure_xy_distance(p1, p2):
    """Measure X and Y distance separately"""
    return p1[0] - p2[0], p1[1] - p2[1]


def add_adjust_positions_to_tracks(tracks, camera_movement_per_frame):
    """Add adjusted positions to tracks based on camera movement"""
    for object_name, object_tracks in tracks.items():
        for frame_num, track in enumerate(object_tracks):
            for track_id, track_info in track.items():
                position = track_info['position']
                camera_movement = camera_movement_per_frame[frame_num]
                position_adjusted = (
                    position[0] - camera_movement[0],
                    position[1] - camera_movement[1]
                )
                tracks[object_name][frame_num][track_id]['position_adjusted'] = position_adjusted


def get_camera_movement(frames, read_from_stub=False, stub_path=None, minimum_distance=None):
    """Calculate camera movement for all frames"""
    if minimum_distance is None:
        minimum_distance = MINIMUM_DISTANCE
    
    # Read from stub if available
    if read_from_stub and stub_path is not None and os.path.exists(stub_path):
        with open(stub_path, 'rb') as f:
            return pickle.load(f)
    
    camera_movement = [[0, 0]] * len(frames)
    old_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    features_params = _get_features_params(frames[0])
    old_features = cv2.goodFeaturesToTrack(old_gray, **features_params)
    
    for frame_num in range(1, len(frames)):
        frame_gray = cv2.cvtColor(frames[frame_num], cv2.COLOR_BGR2GRAY)
        new_features, _, _ = cv2.calcOpticalFlowPyrLK(
            old_gray, frame_gray, old_features, None, **LK_PARAMS
        )
        max_distance = 0
        camera_movement_x, camera_movement_y = 0, 0
        for i, (new, old) in enumerate(zip(new_features, old_features)):
            new_features_point = new.ravel()
            old_features_point = old.ravel()
            distance = _measure_distance(new_features_point, old_features_point)
            if distance > max_distance:
                max_distance = distance
                camera_movement_x, camera_movement_y = _measure_xy_distance(
                    old_features_point, new_features_point
                )
        if max_distance > minimum_distance:
            camera_movement[frame_num] = [camera_movement_x, camera_movement_y]
            features_params = _get_features_params(frames[frame_num])
            old_features = cv2.goodFeaturesToTrack(frame_gray, **features_params)
        
        old_gray = frame_gray.copy()
    
    # Save to stub if path provided
    if stub_path is not None:
        with open(stub_path, 'wb') as f:
            pickle.dump(camera_movement, f)
    
    return camera_movement


def draw_camera_movement(frames, camera_movement_per_frame):
    """Draw camera movement overlay on frames"""
    output_frames = []
    
    for frame_num, frame in enumerate(frames):
        frame = frame.copy()
        overlay = frame.copy()
        
        cv2.rectangle(overlay, (0, 0), (500, 100), (255, 255, 255), -1)
        alpha = 0.6
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        
        x_movement, y_movement = camera_movement_per_frame[frame_num]
        frame = cv2.putText(
            frame, f"Camera Movement X: {x_movement:.2f}",
            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 3
        )
        frame = cv2.putText(
            frame, f"Camera Movement Y: {y_movement:.2f}",
            (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 3
        )
        
        output_frames.append(frame)
    
    return output_frames