import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flu_risk_predictor import FluRiskPredictor
from data_processor import FluDataProcessor

def main():
    # Example data (replace with your actual data file)
    data_file = os.path.join(os.path.dirname(__file__), 'data', 'sales_data.csv')
    
    # Initialize the processor
    processor = FluDataProcessor()
    
    try:
        # Load and process the data
        data = processor.load_data(data_file)
        features = processor.preprocess_sales_data(data)
        target = processor.create_target(data)
        
        # Get the processed features and target
        X, y = processor.get_features_and_target()
        
        # Initialize and train the predictor
        predictor = FluRiskPredictor()
        history = predictor.train(X, y)
        
        # Plot training history
        predictor.plot_training_history(history)
        
        # Example prediction
        predictions = predictor.predict(X)
        print("\nPredictions:")
        for city, pred in zip(features['city'], predictions):
            print(f"{city}: {pred[0]:.2f}")
            
    except FileNotFoundError:
        print(f"Error: Could not find data file at {data_file}")
        print("Please create a 'data' directory and add your sales_data.csv file")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main() 