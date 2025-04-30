# Flu Risk Prediction System

This system uses a neural network to predict flu risk levels (1-10) for Canadian cities based on pharmacy sales data.

## Requirements

Install the required packages using:

```bash
pip install -r requirements.txt
```

## Data Format

The input data should be in CSV format with the following columns:

- `city`: Name of the city
- `date`: Date of the sales record
- `sales`: Number of flu-related product sales

Example:

```csv
city,date,sales
Toronto,2023-01-01,150
Vancouver,2023-01-01,120
Montreal,2023-01-01,90
```

## Usage

1. Prepare your data in the required CSV format
2. Use the `FluDataProcessor` class to process your data:

```python
from data_processor import FluDataProcessor

# Initialize the processor
processor = FluDataProcessor()

# Load and process the data
data = processor.load_data('your_data.csv')
features = processor.preprocess_sales_data(data)
target = processor.create_target(data)

# Get the processed features and target
X, y = processor.get_features_and_target()
```

3. Train the model:

```python
from flu_risk_predictor import FluRiskPredictor

# Initialize and train the predictor
predictor = FluRiskPredictor()
history = predictor.train(X, y)

# Plot training history
predictor.plot_training_history(history)
```

4. Make predictions:

```python
# Prepare new data for prediction
new_data = processor.preprocess_sales_data(new_sales_data)

# Make predictions
predictions = predictor.predict(new_data)
```

## Model Architecture

The neural network consists of:

- Input layer
- Two hidden layers with ReLU activation
- Dropout layers for regularization
- Output layer with sigmoid activation (scaled to 1-10)

## Risk Index Interpretation

The risk index ranges from 1 to 10:

- 1-3: Low risk
- 4-6: Moderate risk
- 7-10: High risk

## Notes

- The model uses historical sales data to establish baseline patterns
- Risk thresholds can be adjusted in the `FluDataProcessor` class
- The system is designed to be retrained periodically as new data becomes available
