from team_classifier import register_reference
import cv2

# Load your cropped jersey sample images
img1 = cv2.imread("team_red_sample.jpg")
register_reference("Red", img1)

img2 = cv2.imread("team_blue_sample.jpg")
register_reference("Blue", img2)

print("✅ Teams registered successfully!")
