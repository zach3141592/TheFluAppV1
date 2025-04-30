import os
import sys
import numpy as np
import pandas as pd
import keras
from keras.models import Sequential
from keras.layers import Dense, Dropout
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from tensorflow.keras.optimizers import Adam
import random
import pytz

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_processor import FluDataProcessor

class FluRiskPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.history = None
        self.features = None
        self.data = None
        
    def build_model(self, input_shape):
        """Build and compile the neural network model"""
        self.model = Sequential([
            Dense(128, activation='relu', input_shape=input_shape),
            Dropout(0.3),  # Add dropout to prevent overfitting
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')  # Use sigmoid to bound output between 0 and 1
        ])
        
        self.model.compile(
            optimizer=Adam(learning_rate=0.0005),  # Reduced learning rate
            loss='mean_squared_error',
            metrics=['mean_absolute_error']
        )
        
        return self.model
    
    def preprocess_data(self, data):
        """Preprocess the input data using StandardScaler"""
        self.scaler.fit(data)
        return self.scaler.transform(data)
    
    def train(self, X, y, epochs=100, batch_size=32, validation_split=0.2):
        """Train the model on the provided data"""
        if self.model is None:
            self.build_model((X.shape[1],))
        
        self.history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=1
        )
        
        return self.history
    
    def predict(self, X):
        """Make predictions using the trained model"""
        if self.model is None:
            raise ValueError("Model has not been trained yet")
        return self.model.predict(X)
    
    def normalize_risk(self, risk_value, min_risk=0, max_risk=10):
        """Normalize risk value to be between 1 and 10 with more realistic distribution"""
        if max_risk == min_risk:
            return 1.0
        
        # Apply sigmoid-like transformation for more realistic distribution
        normalized = (risk_value - min_risk) / (max_risk - min_risk)
        
        # Adjust the sigmoid parameters for more realistic distribution
        # This will create more values in the middle range (4-8) and fewer extremes
        sigmoid_normalized = 1 / (1 + np.exp(-1.2 * (normalized - 0.1)))  # Adjusted sigmoid parameters
        
        # Scale to 1-10 range with more realistic distribution
        risk = 1 + sigmoid_normalized * 9  # Start from 1 and scale up to 10
        
        # Add some random variation (±0.5) to make it more realistic
        variation = (random.random() - 0.5) * 0.5
        risk = max(1.0, min(10.0, risk + variation))
        
        return round(risk, 1)  # Round to 1 decimal place
    
    def calculate_national_risk(self, features, X_scaled):
        """Calculate the national risk index with adjusted weights"""
        predictions = self.predict(X_scaled)
        populations = features['total_flu_cases'].values
        
        # Weight by population and add seasonal factor
        weighted_risks = predictions * populations
        raw_risk = np.sum(weighted_risks) / np.sum(populations)
        
        # Add seasonal adjustment with stronger effect
        month = datetime.now().month
        seasonal_factor = 1.8 if month in [12, 1, 2] else 1.4 if month in [3, 4, 10, 11] else 1.0
        
        # Add base risk to ensure minimum values
        base_risk = 3.0  # Minimum national risk
        
        return self.normalize_risk(raw_risk * seasonal_factor + base_risk)
    
    def calculate_provincial_risks(self, data_processor, X_scaled):
        """Calculate risk indices for each province with adjusted weights"""
        predictions = self.predict(X_scaled)
        provinces = np.unique(data_processor.provinces)
        raw_risks = {}
        
        # First calculate raw risks with population weighting
        for province in provinces:
            province_mask = data_processor.provinces == province
            province_predictions = predictions[province_mask]
            province_populations = data_processor.features.loc[province_mask, 'total_flu_cases'].values
            weighted_risks = province_predictions * province_populations
            raw_risks[province] = float(np.sum(weighted_risks) / np.sum(province_populations))
        
        # Find min and max for normalization
        min_risk = min(raw_risks.values())
        max_risk = max(raw_risks.values())
        
        # Add seasonal adjustment with stronger effect
        month = datetime.now().month
        seasonal_factor = 1.8 if month in [12, 1, 2] else 1.4 if month in [3, 4, 10, 11] else 1.0
        
        # Add base risk to ensure minimum values
        base_risk = 2.5  # Minimum provincial risk
        
        # Normalize all risks with seasonal adjustment
        provincial_risks = {
            province: self.normalize_risk(risk * seasonal_factor + base_risk, min_risk, max_risk)
            for province, risk in raw_risks.items()
        }
        
        return provincial_risks
    
    def predict_city_risks(self, data_processor, X_scaled):
        """Calculate current risk indices for each city with adjusted weights"""
        predictions = self.predict(X_scaled)
        raw_risks = {}
        
        # First calculate raw risks with population density weighting
        for i, city in enumerate(data_processor.city_names):
            population_density = data_processor.features.loc[i, 'population'] / data_processor.features.loc[i, 'land_area']
            density_factor = min(2.0, 1 + (population_density / 3000))  # Increased density effect
            raw_risks[city] = float(predictions[i] * density_factor)
        
        # Find min and max for normalization
        min_risk = min(raw_risks.values())
        max_risk = max(raw_risks.values())
        
        # Add seasonal adjustment with stronger effect
        month = datetime.now().month
        seasonal_factor = 1.8 if month in [12, 1, 2] else 1.4 if month in [3, 4, 10, 11] else 1.0
        
        # Add base risk to ensure minimum values
        base_risk = 2.0  # Minimum city risk
        
        # Normalize all risks with seasonal adjustment
        city_risks = {
            city: self.normalize_risk(risk * seasonal_factor + base_risk, min_risk, max_risk)
            for city, risk in raw_risks.items()
        }
        
        return city_risks
    
    def predict_future_risks(self, data_processor, X_scaled, days=7):
        """Predict future risk indices for each city for the next n days"""
        # Set the date to April 29, 2025
        current_date = datetime(2025, 4, 29)
        
        future_risks = {}
        
        # Get current risks
        current_risks = self.predict_city_risks(data_processor, X_scaled)
        
        for city, current_risk in current_risks.items():
            city_future_risks = {}
            
            # Calculate trend based on historical data
            city_data = data_processor.features[data_processor.features['city'] == city]
            if not city_data.empty:
                trend = city_data['total_flu_cases'].pct_change().mean()
                if pd.isna(trend):
                    trend = 0
            else:
                trend = 0
            
            # Add some random variation to the trend
            trend_variation = (random.random() - 0.5) * 0.1
            trend = max(-0.1, min(0.1, trend + trend_variation))
            
            for i in range(days):
                future_date = current_date + timedelta(days=i)
                
                # Calculate risk with trend and seasonal adjustment
                risk = current_risk * (1 + trend * i)
                
                # Add seasonal adjustment
                month = future_date.month
                seasonal_factor = 1.8 if month in [12, 1, 2] else 1.4 if month in [3, 4, 10, 11] else 1.0
                risk *= seasonal_factor
                
                # Add random variation
                variation = (random.random() - 0.5) * 0.5
                risk = max(1.0, min(10.0, risk + variation))
                
                city_future_risks[future_date.strftime('%Y-%m-%d')] = round(risk, 1)
            
            future_risks[city] = city_future_risks
        
        return future_risks
    
    def plot_training_history(self, history):
        plt.figure(figsize=(12, 4))
        
        plt.subplot(1, 2, 1)
        plt.plot(history.history['loss'])
        plt.title('Model Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        
        plt.subplot(1, 2, 2)
        plt.plot(history.history['mean_absolute_error'])
        plt.title('Model MAE')
        plt.xlabel('Epoch')
        plt.ylabel('MAE')
        
        plt.tight_layout()
        plt.show()

    def create_target(self, historical_data, risk_thresholds=None):
        """Create target variable (flu risk index) based on the ratio between normalized flu cases and sales, incorporating population density"""
        if risk_thresholds is None:
            # Default thresholds based on normalized flu-to-sales ratio
            risk_thresholds = {
                'low': 0.1,    # 10% of normalized ratio
                'medium': 0.2,  # 20% of normalized ratio
                'high': 0.3    # 30% of normalized ratio
            }
        
        # Calculate risk index based on normalized flu-to-sales ratio and population density
        risk_index = []
        
        for city in self.features['city']:
            city_data = historical_data[historical_data['city'] == city]
            current_sales = self.features[self.features['city'] == city]['total_sales'].values[0]
            current_flu = self.features[self.features['city'] == city]['total_flu_cases'].values[0]
            population = self.features[self.features['city'] == city]['population'].values[0]
            land_area = self.features[self.features['city'] == city]['land_area'].values[0]
            
            # Calculate population density (people per square km)
            population_density = population / land_area
            
            # Calculate normalized values per capita
            flu_per_capita = current_flu / population
            sales_per_capita = current_sales / population
            
            # Calculate risk based on the ratio of normalized flu cases to normalized sales
            # Higher ratio indicates higher risk
            risk_ratio = flu_per_capita / sales_per_capita if sales_per_capita > 0 else 0
            
            # Adjust risk based on population density
            # Higher density areas have higher risk
            density_factor = min(1.0, population_density / 5000)  # Normalize density factor to max 1.0
            adjusted_risk_ratio = risk_ratio * (1 + density_factor)
            
            if adjusted_risk_ratio < risk_thresholds['low']:
                risk = 1
            elif adjusted_risk_ratio < risk_thresholds['medium']:
                risk = 3
            elif adjusted_risk_ratio < risk_thresholds['high']:
                risk = 7
            else:
                risk = 10
            
            risk_index.append(risk)
        
        self.target = np.array(risk_index)
        return self.target

def main():
    # Example usage
    # Note: Replace this with your actual data loading code
    print("Flu Risk Predictor - Example Usage")
    print("Please implement your data loading logic in the main function")
    
    # Example data structure (replace with actual data)
    # X should be a numpy array or pandas DataFrame with features
    # y should be a numpy array with target values (1-10)
    
    # Example:
    # predictor = FluRiskPredictor()
    # history = predictor.train(X, y)
    # predictions = predictor.predict(new_data)
    
if __name__ == "__main__":
    main() 