from __future__ import division, print_function
import os
import numpy as np
import tensorflow_hub as hub
import tensorflow as tf
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from tensorflow.keras.utils import load_img, img_to_array
from flask_cors import CORS
from collections import OrderedDict  # ✅ Ensures ordered JSON response

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ✅ Model path
MODEL_PATH = r"C:\Users\ARDRA\OneDrive\Desktop\MAINPROJECT\plant back\20240921-2014-full-image-set-mobilenetv2-Adam (1).h5"

# ✅ Load model with custom KerasLayer
model = load_model(MODEL_PATH, custom_objects={'KerasLayer': hub.KerasLayer})
print('✅ Model loaded. Ready for predictions!')

# ✅ Class labels
class_labels = [
    'African Violet (Saintpaulia ionantha)', 'Aloe Vera',
    'Anthurium (Anthurium andraeanum)', 'Areca Palm (Dypsis lutescens)',
    'Asparagus Fern (Asparagus setaceus)', 'Begonia (Begonia spp.)',
    'Bird of Paradise (Strelitzia reginae)', 'Birds Nest Fern (Asplenium nidus)',
    'Boston Fern (Nephrolepis exaltata)', 'Calathea',
    'Cast Iron Plant (Aspidistra elatior)', 'Chinese Money Plant (Pilea peperomioides)',
    'Chinese evergreen (Aglaonema)', 'Christmas Cactus (Schlumbergera bridgesii)',
    'Chrysanthemum', 'Ctenanthe', 'Daffodils (Narcissus spp.)', 'Dracaena',
    'Dumb Cane (Dieffenbachia spp.)', 'Elephant Ear (Alocasia spp.)',
    'English Ivy (Hedera helix)', 'Hyacinth (Hyacinthus orientalis)',
    'Iron Cross begonia (Begonia masoniana)', 'Jade plant (Crassula ovata)',
    'Kalanchoe', 'Lilium (Hemerocallis)', 'Lily of the valley (Convallaria majalis)',
    'Money Tree (Pachira aquatica)', 'Monstera Deliciosa (Monstera deliciosa)',
    'Orchid', 'Parlor Palm (Chamaedorea elegans)', 'Peace lily',
    'Poinsettia (Euphorbia pulcherrima)', 'Polka Dot Plant (Hypoestes phyllostachya)',
    'Ponytail Palm (Beaucarnea recurvata)', 'Pothos (Ivy arum)',
    'Prayer Plant (Maranta leuconeura)', 'Rattlesnake Plant (Calathea lancifolia)',
    'Rubber Plant (Ficus elastica)', 'Sago Palm (Cycas revoluta)',
    'Schefflera', 'Snake plant (Sanseviera)', 'Tradescantia', 'Tulip',
    'Venus Flytrap', 'Yucca', 'ZZ Plant (Zamioculcas zamiifolia)'
]

# ✅ Image prediction function
def model_predict(img_path, model):
    img = load_img(img_path, target_size=(224, 224))  # Resize to match model input
    x = img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = x / 255.0  # Normalize
    preds = model.predict(x)
    return preds

# ✅ Custom function to ensure correct JSON order
def custom_decode_predictions(preds, class_labels):
    top_index = np.argmax(preds[0])  # Get the index of the highest probability
    return OrderedDict([
        ("plant", class_labels[top_index]),  # Plant name first
        ("confidence", round(float(preds[0][top_index]), 4))  # Confidence second
    ])

# ✅ Root route (just a welcome message)
@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Welcome to the Plant Prediction API! Use /predict to classify images."})

# ✅ Prediction API (POST request)
@app.route('/predict', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    f = request.files['file']
    if f.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save image to a temporary location
    basepath = os.path.dirname(__file__)
    file_path = os.path.join(basepath, secure_filename(f.filename))
    f.save(file_path)

    # Predict
    preds = model_predict(file_path, model)
    pred_class = custom_decode_predictions(preds, class_labels)  # Get top-1 prediction

    # Remove the temporary image file
    os.remove(file_path)

    return jsonify(pred_class)  # Returns JSON with plant name first, then confidence

# ✅ Run Flask app
if __name__ == '__main__':
    app.run(debug=True)
