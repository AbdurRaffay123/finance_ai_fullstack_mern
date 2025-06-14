import os
import joblib
import pandas as pd

# Absolute paths for model and preprocessor
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'Finance_model', 'elasticnet_multioutput_model.joblib')
PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), 'Finance_model', 'preprocessor.joblib')

# Load model and preprocessor
try:
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    print("Model and Preprocessor loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading model or preprocessor: {e}")
    raise

# Target columns expected from prediction
target_columns = [
    'Potential_Savings_Groceries', 'Potential_Savings_Transport', 'Potential_Savings_Eating_Out',
    'Potential_Savings_Entertainment', 'Potential_Savings_Utilities', 'Potential_Savings_Miscellaneous'
]

# Prediction function (for frontend input)
def make_prediction(user_input):
    try:
        # Convert user input into a pandas DataFrame
        input_df = pd.DataFrame([user_input])
        
        # Ensure all required features are present
        for col in preprocessor.feature_names_in_:
            if col not in input_df.columns:
                input_df[col] = 0  # Add missing columns with default value 0
        
        # Reorder columns to match the preprocessor input
        input_df = input_df[preprocessor.feature_names_in_]
        
        # Preprocess the input
        processed_input = preprocessor.transform(input_df)

        # Make prediction
        prediction = model.predict(processed_input)[0]

        # Map predictions to category names
        prediction_result = {
            col: round(val, 2) for col, val in zip(target_columns, prediction)
        }

        # Compute total predicted savings
        prediction_result["Total_Predicted_Savings"] = round(sum(prediction), 2)

        return prediction_result

    except Exception as e:
        print(f"Error during prediction: {e}")
        raise
