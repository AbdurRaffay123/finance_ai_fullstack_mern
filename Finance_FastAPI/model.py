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
        
        # Log raw prediction for debugging
        print(f"Raw prediction values: {prediction}")
        print(f"Prediction shape: {prediction.shape}")
        print(f"Input data summary:")
        print(f"  Income: {user_input.get('Income', 0)}")
        print(f"  Transport: {user_input.get('Transport', 0)}")
        print(f"  Groceries: {user_input.get('Groceries', 0)}")

        # Validate and clamp predictions to reasonable values
        # Predictions should be savings amounts, which should be less than the input expenses
        max_reasonable_savings = {
            'Potential_Savings_Groceries': user_input.get('Groceries', 0) * 0.5,  # Max 50% savings
            'Potential_Savings_Transport': user_input.get('Transport', 0) * 0.5,
            'Potential_Savings_Eating_Out': user_input.get('Eating_Out', 0) * 0.5,
            'Potential_Savings_Entertainment': user_input.get('Entertainment', 0) * 0.5,
            'Potential_Savings_Utilities': user_input.get('Utilities', 0) * 0.5,
            'Potential_Savings_Miscellaneous': user_input.get('Miscellaneous', 0) * 0.5,
        }
        
        # Map predictions to category names and validate
        prediction_result = {}
        for i, col in enumerate(target_columns):
            raw_val = prediction[i]
            # Clamp to reasonable maximum (50% of input expense for that category)
            max_val = max_reasonable_savings.get(col, raw_val)
            # Ensure prediction is positive and reasonable
            clamped_val = max(0, min(raw_val, max_val))
            
            # If value is suspiciously large, log warning
            if raw_val > max_val * 2:
                print(f"⚠️ WARNING: {col} prediction {raw_val:.2f} seems too large, clamping to {clamped_val:.2f}")
            
            prediction_result[col] = round(clamped_val, 2)

        # Compute total predicted savings
        prediction_result["Total_Predicted_Savings"] = round(sum(prediction_result.values()), 2)
        
        print(f"Final prediction result: {prediction_result}")

        return prediction_result

    except Exception as e:
        print(f"Error during prediction: {e}")
        raise
