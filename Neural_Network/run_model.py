import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
from flu_risk_predictor import FluRiskPredictor
from data_processor import FluDataProcessor
import matplotlib.pyplot as plt

def parse_arguments():
    parser = argparse.ArgumentParser(description='Run flu risk prediction model')
    parser.add_argument('--city', type=str, help='City to predict risk for')
    parser.add_argument('--date', type=str, help='Date to predict risk for')
    return parser.parse_args()

def run_model():
    # Initialize data processor and model
    data_processor = FluDataProcessor()
    model = FluRiskPredictor()
    
    # Load and process data
    data = data_processor.load_data('database')
    features = data_processor.preprocess_sales_data(data)
    
    # Create target variable
    target = data_processor.create_target(data)
    
    # Get features and target
    X, y = data_processor.get_features_and_target()
    
    # Preprocess data and train model
    X_scaled = model.preprocess_data(X)
    model.train(X_scaled, y, epochs=100)
    
    # Calculate predictions
    predictions = model.predict(X_scaled)
    
    # Calculate national risk index
    national_risk = model.calculate_national_risk(features, X_scaled)
    
    # Calculate provincial risk indices
    provincial_risks = model.calculate_provincial_risks(data_processor, X_scaled)
    
    # Calculate current city risks
    current_city_risks = model.predict_city_risks(data_processor, X_scaled)
    
    # Calculate future risk predictions
    future_risks = model.predict_future_risks(data_processor, X_scaled, days=7)
    
    # Return predictions in a format suitable for the frontend
    return {
        'national_risk': float(national_risk),
        'provincial_risks': {k: float(v) for k, v in provincial_risks.items()},
        'current_city_risks': current_city_risks,
        'future_risks': {k: float(v) for k, v in future_risks.items()}
    }

def main():
    # Initialize the data processor and model
    data_processor = FluDataProcessor()
    model = FluRiskPredictor()

    # Load and process data
    print("Loading data from database...")
    data = data_processor.load_data('database')
    features = data_processor.preprocess_sales_data(data)
    features = data_processor.add_population_data(features)

    # Create target variable
    target = data_processor.create_target(data)

    # Prepare features for training
    numerical_features = data_processor.get_features_for_training(features)
    X = numerical_features.values
    X = data_processor.preprocess_data(X)
    y = target.astype(np.float32)  # Convert target to float32

    # Train the model
    print("\nTraining model...")
    history = model.train(X, y, epochs=100)

    # Calculate and display national risk
    national_risk = model.calculate_national_risk(features, X)
    print(f"\nNational Flu Risk Index: {national_risk:.1f}/10")

    # Calculate and display provincial risks
    print("\nProvincial Flu Risk Indices:")
    provincial_risks = model.calculate_provincial_risks(features, X)
    for province, risk in sorted(provincial_risks.items(), key=lambda x: x[1], reverse=True):
        print(f"{province}: {risk:.1f}/10")

    # Calculate and display current city risks
    print("\nCurrent City Flu Risk Indices:")
    city_risks = model.calculate_city_risks(features, X)
    for city, risk in sorted(city_risks.items(), key=lambda x: x[1], reverse=True):
        print(f"{city}: {risk:.1f}/10")

    # Predict future risks
    print("\nPredicted City Flu Risk Indices for Next Week:")
    future_risks = model.predict_future_risks(features, X)
    for city, risk in sorted(future_risks.items(), key=lambda x: x[1], reverse=True):
        print(f"{city}: {risk:.1f}/10")

    # Plot training history
    model.plot_history(history)

if __name__ == "__main__":
    main() 