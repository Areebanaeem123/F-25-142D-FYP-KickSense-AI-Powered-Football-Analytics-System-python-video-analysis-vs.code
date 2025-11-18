#!/usr/bin/env python3
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from team_classifier import TeamClassifier
import tempfile
import shutil

# === CONFIGURATION ===
MODEL_PATH = "/home/labuser/Downloads/weights/best.pt"
VIDEO_PATH = "/home/labuser/Desktop/KickSense/input_videos/tayyab_vid.mp4"
OUTPUT_VIDEO = "styled_output_with_teams.mp4"
CONF_THRESHOLD = 0.4
SHOW_WINDOW = False  # DISABLE GUI TO TEST
ENABLE_TEAM_CLASSIFICATION = False  # DISABLE TEAM CLASSIFICATION TO TEST
TEAM_ASSIGNMENT_FRAMES = [5, 10, 15, 20, 25, 30, 35, 40]
# ======================

# Determine device safely
try:
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except Exception:
    DEVICE = "cpu"

print(f"Using device: {DEVICE}")

# Headless safety
is_linux = os.name == "posix"
display_env = os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")
if is_linux and not display_env:
    SHOW_WINDOW = False
    print("⚠️ No display detected. GUI disabled.")

# Class definitions
CLASS_COLORS = {0: (0,0,0), 1: (255,0,0), 2: (0,225,0), 3: (0,255,255)}
CLASS_NAMES = {0:"Ball",1:"Goalkeeper",2:"Player",3:"Referee"}

# === UTILITY FUNCTIONS ===
def get_center_of_bbox(bbox):
    x1,y1,x2,y2 = bbox
    return int((x1+x2)/2), int((y1+y2)/2)

def get_bbox_width(bbox):
    return int(bbox[2]-bbox[0])

def crop_player(frame,bbox):
    x1,y1,x2,y2 = map(int,bbox)
    h,w = frame.shape[:2]
    x1,x2 = max(0,x1), min(w,x2)
    y1,y2 = max(0,y1), min(h,y2)
    if x2<=x1 or y2<=y1: return None
    return frame[y1:y2, x1:x2]

def draw_ellipse(frame, bbox, color, track_id=None):
    try:
        y2 = int(bbox[3])
        x_center,_ = get_center_of_bbox(bbox)
        width = max(1,get_bbox_width(bbox))
        cv2.ellipse(frame,(x_center,y2),(int(width),int(0.35*width)),0,-45,235,color,2)
        if track_id is not None:
            rect_w, rect_h = 40, 20
            x1r, x2r = x_center - rect_w//2, x_center + rect_w//2
            y1r, y2r = (y2 - rect_h//2)+15, (y2 + rect_h//2)+15
            cv2.rectangle(frame,(x1r,y1r),(x2r,y2r),color,cv2.FILLED)
            x_text = x1r + 12
            cv2.putText(frame,str(track_id),(x_text,y1r+15),cv2.FONT_HERSHEY_SIMPLEX,0.6,(255,255,255),2)
    except Exception as e:
        print(f"⚠️ draw_ellipse error: {e}")
    return frame

def draw_triangle(frame,bbox,color):
    try:
        y=int(bbox[1])
        x,_=get_center_of_bbox(bbox)
        pts = np.array([[x,y],[x-10,y-20],[x+10,y-20]])
        cv2.drawContours(frame,[pts],0,color,cv2.FILLED)
        cv2.drawContours(frame,[pts],0,(255,255,255),2)
    except Exception as e:
        print(f"⚠️ draw_triangle error: {e}")
    return frame

def draw_legend(frame, team_colors=None):
    try:
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",24)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",18)
        except:
            title_font,text_font = ImageFont.load_default(),ImageFont.load_default()
        lx,ly = 20,20
        lw = 220
        lh = 200 if team_colors else 140
        overlay = frame.copy()
        cv2.rectangle(overlay,(lx,ly),(lx+lw,ly+lh),(0,100,0),-1)
        cv2.addWeighted(overlay,0.6,frame,0.4,0,frame)
        frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(frame_pil)
        draw.rectangle([(lx,ly),(lx+lw,ly+lh)],outline=(200,200,200),width=2)
        draw.text((lx+10,ly+5),"Legend",font=title_font,fill=(0,0,0))
        y_offset = ly+50
        spacing = 25
        items = [("Ball",CLASS_COLORS[0]),("Referee",CLASS_COLORS[3])]
        if team_colors: items += [("Team1",team_colors.get(1,(255,0,0))),("Team2",team_colors.get(2,(0,0,255)))]
        else: items += [("Goalkeeper",CLASS_COLORS[1]),("Player",CLASS_COLORS[2])]
        frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
        for label,color in items:
            cv2.circle(frame,(lx+20,y_offset),8,color,-1)
            cv2.circle(frame,(lx+20,y_offset),8,(0,0,0),1)
            frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            draw = ImageDraw.Draw(frame_pil)
            draw.text((lx+40,y_offset-8),label,font=text_font,fill=(0,0,0))
            frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
            y_offset+=spacing
        return frame
    except Exception as e:
        print(f"⚠️ draw_legend error: {e}")
        return frame

def collect_player_crops(cap, model, frames):
    crops=[]
    orig=cap.get(cv2.CAP_PROP_POS_FRAMES)
    print(f"\n🎬 Collecting crops from {len(frames)} frames...")
    for f in frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES,f)
        ret,frame=cap.read()
        if not ret: continue
        try: res=model.predict(frame,conf=CONF_THRESHOLD,iou=0.5,device=DEVICE,verbose=False)
        except TypeError: res=model.predict(frame,conf=CONF_THRESHOLD,iou=0.5,verbose=False)
        det=res[0]
        for box in getattr(det,"boxes",[]):
            cls=int(box.cls[0])
            if cls in [1,2]:
                x1,y1,x2,y2=map(int,box.xyxy[0])
                crop=crop_player(frame,[x1,y1,x2,y2])
                if crop is not None and crop.shape[0]>0 and crop.shape[1]>0:
                    crops.append(crop)
    cap.set(cv2.CAP_PROP_POS_FRAMES,orig)
    print(f"✅ Collected {len(crops)} crops")
    return crops

def process_detections(frame,detections,trackers,team_assignments=None,team_colors=None):
    det_list={0:[],1:[],2:[],3:[]}
    for box in getattr(detections,"boxes",[]):
        try:
            conf=float(box.conf[0])
            if conf<CONF_THRESHOLD: continue
            cls=int(box.cls[0])
            x1,y1,x2,y2=map(int,box.xyxy[0])
        except: continue
        if cls==0: frame=draw_triangle(frame,[x1,y1,x2,y2],CLASS_COLORS[0])
        else:
            w,h=x2-x1,y2-y1
            det_list[cls].append(([x1,y1,w,h],conf,str(cls)))
    
    for cls in [1,2,3]:
        if len(det_list[cls])>0:
            try: 
                tracks=trackers[cls].update_tracks(det_list[cls],frame=frame)
            except Exception as e:
                print(f"⚠️ Tracker update error for class {cls}: {e}")
                tracks=[]
            for t in tracks:
                try:
                    if not t.is_confirmed(): continue
                    tid=t.track_id
                    x1,y1,x2,y2=map(int,t.to_ltrb())
                    bbox=[x1,y1,x2,y2]
                    if cls in [1,2] and team_assignments and tid in team_assignments:
                        color=team_colors.get(team_assignments[tid],CLASS_COLORS[cls])
                    else: color=CLASS_COLORS.get(cls,(255,255,255))
                    frame=draw_ellipse(frame,bbox,color,tid)
                except Exception as e:
                    print(f"⚠️ Track processing error: {e}")
                    continue
    return frame

# === VIDEO HANDLING ===
def safe_open_video(path):
    cap=cv2.VideoCapture(path)
    if cap.isOpened(): return cap,path
    print("❌ Cannot open video. Attempting to convert to AVI...")
    temp_dir=tempfile.mkdtemp()
    tmp_path=os.path.join(temp_dir,"converted.avi")
    os.system(f"ffmpeg -y -i '{path}' -c:v mjpeg '{tmp_path}' > /dev/null 2>&1")
    cap=cv2.VideoCapture(tmp_path)
    if cap.isOpened(): return cap,tmp_path
    raise RuntimeError(f"Cannot open video even after conversion: {path}")

# === MAIN ===
def main():
    print("=" * 60)
    print("STARTING INFERENCE WITH DEBUG MODE")
    print("=" * 60)
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Model path does not exist.")
        return
    
    print(f"\n[1/8] Loading YOLO model...")
    model=YOLO(MODEL_PATH)
    print("✅ Model loaded")
    
    print(f"\n[2/8] Opening video...")
    cap,video_path=safe_open_video(VIDEO_PATH)
    fps=cap.get(cv2.CAP_PROP_FPS) or 30.0
    w,h=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or -1
    print(f"✅ Video opened: {w}x{h} @ {fps}fps, {frame_count} frames")

    # Team classification
    team_classifier=None
    team_assignments={}
    team_colors=None
    
    print(f"\n[3/8] Team classification: {'ENABLED' if ENABLE_TEAM_CLASSIFICATION else 'DISABLED'}")
    if ENABLE_TEAM_CLASSIFICATION:
        crops=collect_player_crops(cap,model,TEAM_ASSIGNMENT_FRAMES)
        if len(crops)>=10:
            team_classifier=TeamClassifier(device=DEVICE,batch_size=16)
            try:
                team_classifier.fit(crops)
                preds=team_classifier.predict(crops)
                team_colors=team_classifier.get_team_colors(crops,preds)
                print("✅ Team classification done!")
            except Exception as e:
                print(f"⚠️ TeamClassifier failed: {e}")
    else:
        print("✅ Skipped team classification")

    # Trackers
    print(f"\n[4/8] Initializing DeepSort trackers...")
    try:
        trackers={i:DeepSort(max_age=30,n_init=3,nn_budget=100) for i in range(4)}
        print("✅ Trackers initialized")
    except Exception as e:
        print(f"❌ Tracker initialization failed: {e}")
        return

    # Output writer
    print(f"\n[5/8] Setting up video writer...")
    fourcc=cv2.VideoWriter_fourcc(*'mp4v')
    out=cv2.VideoWriter(OUTPUT_VIDEO,fourcc,fps,(w,h))
    if not out.isOpened():
        print("❌ Could not open output video writer")
        return
    print("✅ Video writer ready")

    print(f"\n[6/8] Starting frame processing...")
    frame_idx=0
    try:
        while True:
            ret,frame=cap.read()
            if not ret: 
                print("No more frames to read")
                break
            
            if frame_idx == 0:
                print("Processing first frame...")
            
            # Prediction
            try: 
                res=model.predict(frame,conf=CONF_THRESHOLD,iou=0.5,device=DEVICE,verbose=False)
            except: 
                res=model.predict(frame,conf=CONF_THRESHOLD,iou=0.5,verbose=False)
            
            # Process detections
            frame=process_detections(frame,res[0],trackers,team_assignments,team_colors)
            
            # Draw legend
            frame=draw_legend(frame,team_colors)
            
            # Write frame
            out.write(frame)
            
            if SHOW_WINDOW:
                try:
                    cv2.imshow("KickSense",frame)
                    if cv2.waitKey(1)&0xFF==ord('q'): break
                except: 
                    SHOW_WINDOW=False
                    print("⚠️ GUI display failed, continuing without display")
            
            frame_idx+=1
            if frame_idx % 50 == 0: 
                print(f"✓ Processed {frame_idx} frames...")
            
            # Limit test run
            if frame_idx >= 100:
                print(f"Stopping at frame {frame_idx} for testing")
                break
                
    except KeyboardInterrupt: 
        print("\n🛑 Interrupted by user.")
    except Exception as e:
        print(f"\n❌ ERROR at frame {frame_idx}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print(f"\n[7/8] Cleaning up...")
        cap.release()
        out.release()
        try: cv2.destroyAllWindows()
        except: pass
        print(f"\n[8/8] ✅ Done! Output saved: {OUTPUT_VIDEO}, frames processed: {frame_idx}")

if __name__=="__main__":
    main()