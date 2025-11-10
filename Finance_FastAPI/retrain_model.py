#!/usr/bin/env python3
"""
Script to retrain and save the financial prediction model with current scikit-learn version
This fixes the compatibility issue with the saved model files
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.multioutput import MultiOutputRegressor
from sklearn.linear_model import ElasticNet
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def main():
    print("Loading dataset...")
    # Load dataset
    df = pd.read_csv('Finance_model/data.csv')
    print(f"Dataset loaded with shape: {df.shape}")
    
    # Define expense categories (excluding Healthcare and Education as per original model)
    variable_expenses = [
        'Groceries', 'Transport', 'Eating_Out', 'Entertainment',
        'Utilities', 'Miscellaneous'
    ]
    
    target_columns = [f'Potential_Savings_{cat}' for cat in variable_expenses]
    print(f"Target columns: {target_columns}")
    
    # Features exclude target columns AND the other potential savings columns we don't use
    all_potential_savings = [col for col in df.columns if col.startswith('Potential_Savings_')]
    unused_potential_savings = [col for col in all_potential_savings if col not in target_columns]
    
    feature_cols = df.columns.difference(target_columns + unused_potential_savings).tolist()
    print(f"Feature columns: {feature_cols}")
    
    X = df[feature_cols]
    y = df[target_columns]
    
    # Define categorical and numerical features
    categorical_features = ['Occupation', 'City_Tier']
    numerical_features = [col for col in feature_cols if col not in categorical_features]
    
    print(f"Categorical features: {categorical_features}")
    print(f"Numerical features: {numerical_features}")
    
    # Build preprocessor pipeline
    preprocessor = ColumnTransformer([
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(drop='first', sparse_output=False), categorical_features)
    ])
    
    # Split data
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Fit-transform training and transform test data
    print("Preprocessing data...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    print(f"Processed training data shape: {X_train_proc.shape}")
    print(f"Processed test data shape: {X_test_proc.shape}")
    
    # Build model
    print("Training model...")
    model = MultiOutputRegressor(
        ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=10000, random_state=42)
    )
    
    # Train model
    model.fit(X_train_proc, y_train)
    
    # Evaluate model
    print("Evaluating model...")
    y_pred = model.predict(X_test_proc)
    
    print("Per-category performance:")
    for i, col in enumerate(target_columns):
        mae = mean_absolute_error(y_test[col], y_pred[:, i])
        r2 = r2_score(y_test[col], y_pred[:, i])
        print(f"  {col}: MAE={mae:.2f}, R2={r2:.4f}")
    
    y_test_sum = y_test.sum(axis=1)
    y_pred_sum = y_pred.sum(axis=1)
    overall_mae = mean_absolute_error(y_test_sum, y_pred_sum)
    overall_r2 = r2_score(y_test_sum, y_pred_sum)
    print(f"\nOverall Total Potential Savings: MAE={overall_mae:.2f}, R2={overall_r2:.4f}")
    
    # Save model and preprocessor
    print("Saving model and preprocessor...")
    model_path = 'Finance_model/elasticnet_multioutput_model.joblib'
    preprocessor_path = 'Finance_model/preprocessor.joblib'
    
    # Create backup of old files if they exist
    if os.path.exists(model_path):
        os.rename(model_path, model_path + '.backup')
        print(f"Backed up old model to {model_path}.backup")
    
    if os.path.exists(preprocessor_path):
        os.rename(preprocessor_path, preprocessor_path + '.backup')
        print(f"Backed up old preprocessor to {preprocessor_path}.backup")
    
    # Save new model and preprocessor
    joblib.dump(model, model_path)
    joblib.dump(preprocessor, preprocessor_path)
    
    print("✅ Model and preprocessor saved successfully!")
    print(f"Model saved to: {model_path}")
    print(f"Preprocessor saved to: {preprocessor_path}")
    
    # Test the saved model
    print("\nTesting saved model...")
    try:
        loaded_model = joblib.load(model_path)
        loaded_preprocessor = joblib.load(preprocessor_path)
        
        # Test with a sample
        sample_data = {
            'Income': 50000,
            'Age': 35,
            'Dependents': 2,
            'Occupation': 'Professional',
            'City_Tier': 'Tier_2',
            'Rent': 12000,
            'Loan_Repayment': 0,
            'Insurance': 1500,
            'Groceries': 6000,
            'Transport': 2000,
            'Eating_Out': 1500,
            'Entertainment': 1000,
            'Utilities': 2500,
            'Healthcare': 500,
            'Education': 0,
            'Miscellaneous': 300,
            'Desired_Savings_Percentage': 10,
            'Desired_Savings': 5000,
            'Disposable_Income': 15000
        }
        
        sample_df = pd.DataFrame([sample_data])
        sample_processed = loaded_preprocessor.transform(sample_df)
        sample_pred = loaded_model.predict(sample_processed)[0]
        
        print("Sample prediction test:")
        for i, col in enumerate(target_columns):
            print(f"  {col}: {sample_pred[i]:.2f}")
        print(f"  Total: {sum(sample_pred):.2f}")
        
        print("✅ Model loading and prediction test successful!")
        
    except Exception as e:
        print(f"❌ Error testing saved model: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Model retraining completed successfully!")
    else:
        print("\n❌ Model retraining failed!")
        exit(1)
