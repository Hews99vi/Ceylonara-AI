import streamlit as st
import tensorflow as tf
import numpy as np
import os





# Tensorflow Model Prediction
def model_prediction(test_image):
    try:
        model_path = os.path.join(os.getcwd(), 'trained_model.keras')
        model = tf.keras.models.load_model('trained_model.keras')
        image = tf.keras.preprocessing.image.load_img(test_image, target_size=(128, 128))
        input_arr = tf.keras.preprocessing.image.img_to_array(image)
        input_arr = np.array([input_arr])  # Convert single image to a batch
        prediction = model.predict(input_arr)
        result_index = np.argmax(prediction)  # Return index of max element
        return result_index
    except (OSError, ValueError) as e:
        st.error(f"Error loading model: {str(e)}")
        st.info("Please make sure the model file 'trained_model.keras' exists in the correct directory.")
        return None
#slidebar
st.sidebar.title("Tea Sickness Detection")
app_mode = st.sidebar.selectbox("Select Page",["Home","About","Disease Recognition"])

# Home Page
if app_mode == "Home":
    st.header("TEA DISEASE RECOGNITION SYSTEM")
    st.markdown(""" Welcome to our Tea Disease Detection System!
    
    Our mission is to help in identifying Tea plant diseases efficiently. Upload an image of a Tea plant, and our system will analyze it to detect any signs of diseases. Together, let's protect our crops and ensure a healthier harvest!

    ### How It Works
    1. **Upload Image:** Go to the **Tea Disease Recognition** page and upload an image of a plant with suspected diseases.
    2. **Analysis:** Our system will process the image using advanced algorithms to identify potential diseases.
    3. **Results:** View the results and recommendations for further action.

    ### Why Choose Us?
    - **Accuracy:** Our system utilizes state-of-the-art machine learning techniques for accurate disease detection.
    - **User-Friendly:** Simple and intuitive interface for seamless user experience.
    - **Fast and Efficient:** Receive results in seconds, allowing for quick decision-making.

   
""")


#Prediction Page
elif(app_mode=="Disease Recognition"):
    st.header("Disease Recognition")
    test_image = st.file_uploader("Choose an Image:")
    if(st.button("Show Image")):
        st.image(test_image,use_column_width=True)
    #Predict Button
    if(st.button("Predict")):
        with st.spinner("Please Wait.."):
            st.write("Our Prediction")
            result_index = model_prediction(test_image)
            #Define Class
            class_name = [
                'Anthracnose',
                'algal leaf',
                'bird eye spot',
                'brown blight',
                'gray light',
                'healthy',
                'red leaf spot',
                'white spot'
            ]
            st.success(f"Model is Predicting it's a {class_name[result_index]}")