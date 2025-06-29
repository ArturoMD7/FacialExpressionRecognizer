from flask import Flask, render_template, request, jsonify
from model import get_base_model
from utils import preprocess_fer, get_labels_fer
import numpy as np
import cv2
import tensorflow as tf
import base64

app = Flask(__name__)


IMG_SHAPE = (100, 100, 3)
model = get_base_model(IMG_SHAPE)
model.add(tf.keras.layers.Dense(7, activation="softmax", name="softmax"))
model.load_weights('./models/FER.h5')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict(): 
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'Imagen no enviada'}), 400

        # Decodificar imagen base64
        image_data = data['image'].split(',')[1]
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Preprocesamiento
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        x = cv2.resize(img_rgb, dsize=IMG_SHAPE[:-1])
        x = np.expand_dims(x, axis=0)
        x = preprocess_fer(x)

        # Predicción
        output = model(x, training=False).numpy()
        idx = np.argmax(output[0])
        label = get_labels_fer(output)[0]
        confidence = output[0][idx]

        return jsonify({
            'label': label,
            'confidence': float(confidence)
        })

    except Exception as e:
        print(f"Error en /predict: {e}")
        return jsonify({'error': 'Error interno en el servidor'}), 500

if __name__ == '__main__':
    app.run(debug=True)
