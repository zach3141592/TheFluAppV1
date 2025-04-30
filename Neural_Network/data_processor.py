import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.config import engine
from database.models import SalesData
from sklearn.preprocessing import StandardScaler

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class FluDataProcessor:
    def __init__(self):
        self.data = None
        self.features = None
        self.target = None
        self.scaler = StandardScaler()
        self.population_data = {
            'Toronto': 2.93,
            'Montreal': 1.78,
            'Vancouver': 0.675,
            'Calgary': 1.39,
            'Edmonton': 1.01,
            'Ottawa': 1.02,
            'Winnipeg': 0.749,
            'Quebec City': 0.549,
            'Hamilton': 0.58,
            'Kitchener': 0.256,
            'London': 0.422,
            'Victoria': 0.397,
            'Halifax': 0.403,
            'Saskatoon': 0.273,
            'Regina': 0.236
        }
        self.land_area_data = {
            'Toronto': 630.2,
            'Montreal': 431.5,
            'Vancouver': 115.2,
            'Calgary': 825.3,
            'Edmonton': 684.4,
            'Ottawa': 2790.3,
            'Winnipeg': 464.1,
            'Quebec City': 454.1,
            'Hamilton': 1117.2,
            'Kitchener': 136.8,
            'London': 420.6,
            'Victoria': 19.5,
            'Halifax': 5490.4,
            'Saskatoon': 209.6,
            'Regina': 179.2
        }
    
    def load_data(self, source):
        """Load data from either a CSV file or database"""
        if isinstance(source, str) and source.endswith('.csv'):
            return self.load_data_from_csv(source)
        elif source == 'database':
            return self.load_data_from_db()
        else:
            raise ValueError("Invalid data source. Use either a CSV file path or 'database'")
    
    def load_data_from_csv(self, file_path):
        """Load data from a CSV file"""
        self.data = pd.read_csv(file_path)
        return self.data
    
    def load_data_from_db(self):
        """Load data from the database"""
        with Session(engine) as session:
            # Query all sales data
            sales_data = session.query(SalesData).all()
            
            # Convert to DataFrame
            data = []
            for record in sales_data:
                data.append({
                    'city': record.city,
                    'province': record.province,
                    'date': record.date,
                    'sales': record.sales,
                    'flu_cases': record.flu_cases,
                    'population': record.population,
                    'land_area': record.land_area
                })
            
            self.data = pd.DataFrame(data)
            return self.data
    
    def preprocess_sales_data(self, data):
        """Preprocess pharmacy sales data"""
        # Convert date column to datetime if it exists
        if 'date' in data.columns:
            data['date'] = pd.to_datetime(data['date'])
        
        # Group by city and calculate features
        city_features = []
        
        for city in data['city'].unique():
            city_data = data[data['city'] == city]
            
            # Calculate features
            features = {
                'city': city,
                'province': city_data['province'].iloc[0],  # Store province for each city
                'total_sales': city_data['sales'].sum(),
                'avg_daily_sales': city_data['sales'].mean(),
                'sales_std': city_data['sales'].std(),
                'sales_trend': self._calculate_trend(city_data['sales']),
                'peak_sales': city_data['sales'].max(),
                'sales_variance': city_data['sales'].var(),
                'total_flu_cases': city_data['flu_cases'].sum(),
                'avg_daily_flu_cases': city_data['flu_cases'].mean(),
                'flu_cases_std': city_data['flu_cases'].std(),
                'flu_cases_trend': self._calculate_trend(city_data['flu_cases']),
                'peak_flu_cases': city_data['flu_cases'].max(),
                'flu_cases_variance': city_data['flu_cases'].var(),
                'sales_flu_correlation': city_data['sales'].corr(city_data['flu_cases'])
            }
            
            city_features.append(features)
        
        self.features = pd.DataFrame(city_features)
        return self.features
    
    def _calculate_trend(self, series):
        """Calculate the trend of sales over time"""
        if len(series) < 2:
            return 0
        x = np.arange(len(series))
        slope = np.polyfit(x, series, 1)[0]
        return slope
    
    def create_target(self, historical_data, risk_thresholds=None):
        """Create target variable (flu risk index) based on historical data"""
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
            density_factor = min(3.0, 1 + (population_density / 2000))  # Increased density effect
            adjusted_risk_ratio = risk_ratio * density_factor
            
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
    
    def get_features_and_target(self):
        """Return processed features and target"""
        if self.features is None or self.target is None:
            raise ValueError("Data has not been processed yet")
        
        # Store city names and provinces for reference
        self.city_names = self.features['city'].values
        self.provinces = self.features['province'].values
        
        # Select only numerical columns for features
        numerical_features = self.features.select_dtypes(include=['float64', 'int64'])
        return numerical_features.values, self.target

    def add_population_data(self, features):
        """Add population and land area data to the features DataFrame."""
        features['population'] = features['city'].map(self.population_data)
        features['land_area'] = features['city'].map(self.land_area_data)
        return features

    def preprocess_data(self, X):
        """Scale features and convert to float32."""
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled.astype(np.float32)

    def get_features_for_training(self, features):
        """Prepare features for training."""
        # Select only numerical columns for features
        numerical_features = features.select_dtypes(include=['float64', 'int64'])
        return numerical_features 