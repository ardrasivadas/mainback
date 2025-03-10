
import requests

url = "http://127.0.0.1:5000/predict"
image_path = r"C:\Users\ARDRA\OneDrive\Desktop\snake.jpg"  # Update this with your actual image path

with open(image_path, "rb") as img:
    files = {"file": img}
    response = requests.post(url, files=files)

print(response.json())  # Prints the predicted plant name and confidence

