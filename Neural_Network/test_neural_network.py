import os
import sys
import numpy as np
import pandas as pd
from data_processor import FluDataProcessor
from flu_risk_predictor import FluRiskPredictor

def main():
    # Initialize data processor and predictor
    processor = FluDataProcessor()
    predictor = FluRiskPredictor()
    
    # Load and process data from database
    print("Loading data from database...")
    data = processor.load_data('database')
    features = processor.preprocess_sales_data(data)
    
    # Create target variable
    target = processor.create_target(data)
    
    # Get features and target
    X, y = processor.get_features_and_target()
    
    # Convert data to float32 and select only numeric columns
    X = X.select_dtypes(include=[np.number]).astype(np.float32)
    y = y.astype(np.float32)
    
    # Preprocess the data
    X = predictor.preprocess_data(X)
    
    # Train the model
    print("Training the model...")
    history = predictor.train(X, y, epochs=50, batch_size=32)
    
    # Make predictions
    print("\nMaking predictions...")
    predictions = predictor.predict(X)
    
    # Print results
    print("\nResults:")
    print("Actual values:", y)
    print("Predictions:", predictions.flatten())
    
    # Plot training history
    predictor.plot_training_history(history)

if __name__ == "__main__":
    main() 