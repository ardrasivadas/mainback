import tensorflow as tf
import tensorflow_hub as hub

# Load model ensuring compatibility
model = tf.keras.models.load_model(r"C:\Users\ARDRA\OneDrive\Desktop\MAINPROJECT\plant back\model\20240921-2014-full-image-set-mobilenetv2-Adam.h5", custom_objects={'KerasLayer': hub.KerasLayer})

# Resave it properly
model.save("fixed_model.h5")
