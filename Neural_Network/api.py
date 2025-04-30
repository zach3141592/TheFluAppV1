from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import sqlite3
from datetime import datetime, timedelta, timezone
import pandas as pd
import os
import random
import uvicorn
import pytz

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "flu_app.db"

def init_db():
    conn = sqlite3.connect('flu_app.db')
    c = conn.cursor()
    
    # Create users table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            city TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create survey_responses table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS survey_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            age INTEGER NOT NULL,
            postal_code TEXT NOT NULL,
            organization TEXT NOT NULL,
            organization_type TEXT NOT NULL,
            symptoms TEXT NOT NULL,
            province TEXT NOT NULL,
            submission_id TEXT NOT NULL,
            timezone TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

def get_db():
    conn = sqlite3.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

class SurveyResponse(BaseModel):
    age: int
    postalCode: str
    organization: str
    organizationType: str
    symptoms: str
    province: str
    submissionId: str
    timezone: str
    timestamp: str
    userEmail: str

# User models
class UserSignUp(BaseModel):
    name: str
    email: str
    password: str
    city: str

class UserSignIn(BaseModel):
    email: str
    password: str

def get_flu_risk_data() -> Dict:
    try:
        # Read sales data
        sales_data_path = os.path.join(os.path.dirname(__file__), "database", "sales_data.csv")
        sales_data = pd.read_csv(sales_data_path)
        
        # Convert dates to datetime and ensure they're timezone-naive
        sales_data['date'] = pd.to_datetime(sales_data['date']).dt.tz_localize(None)
        
        # Set the date to current date
        current_date = datetime.now()
        
        # Get data for the last 7 days
        recent_data = sales_data[sales_data['date'] >= current_date - timedelta(days=7)].copy()
        
        # If no recent data, use the most recent data available
        if recent_data.empty:
            recent_data = sales_data.sort_values('date', ascending=False).head(7).copy()
        
        # Calculate seasonal factor (higher in winter months)
        month = current_date.month
        seasonal_factor = 1.5 if month in [12, 1, 2] else 1.2 if month in [3, 4, 10, 11] else 1.0
        
        # Initialize dictionaries for storing results
        current_city_risks = {}
        future_risks = {}
        provincial_risks = {}
        
        # List of all Canadian cities we want to track
        all_cities = [
            'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton', 'ottawa',
            'winnipeg', 'quebec city', 'hamilton', 'london', 'halifax', 'saskatoon',
            'regina', "st. john's", 'kelowna'
        ]
        
        # Calculate current city risks and future predictions
        for city in all_cities:
            # Create a copy of the city data to avoid SettingWithCopyWarning
            city_mask = recent_data['city'].str.lower() == city.lower()
            city_data = recent_data[city_mask].copy()
            
            if city_data.empty:
                # If no data for this city, use average values
                city_data = recent_data.copy()
            
            # Calculate base risk using normalized flu cases
            flu_cases_per_100k = (city_data['flu_cases'].mean() / city_data['population'].mean()) * 100000
            base_risk = min(10, max(1, flu_cases_per_100k / 50))
            
            # Add population density factor
            population_density = city_data['population'].mean() / city_data['land_area'].mean()
            density_factor = min(1.5, 1 + (population_density / 5000))
            
            # Calculate initial risk with all factors
            initial_risk = base_risk * density_factor * seasonal_factor
            initial_risk = min(10, max(1, initial_risk))
            
            # Calculate trend based on 7-day moving average
            city_data.loc[:, 'flu_cases_ma'] = city_data['flu_cases'].rolling(window=7, min_periods=1).mean()
            trend = city_data['flu_cases_ma'].pct_change(fill_method=None).mean()
            if pd.isna(trend):
                trend = 0
            
            # Create daily predictions for the next 7 days
            city_future_risks = {}
            for i in range(0, 7):
                future_date = current_date + timedelta(days=i)
                if i == 0:
                    # For the first day, use the initial risk value
                    projected_risk = initial_risk
                else:
                    # For subsequent days, project risk with realistic variation
                    projected_risk = initial_risk * (1 + trend * i)
                    random_variation = 1 + (random.random() - 0.5) * 0.2
                    projected_risk *= random_variation
                
                # Add seasonal adjustment for future dates
                future_month = future_date.month
                future_seasonal_factor = 1.5 if future_month in [12, 1, 2] else 1.2 if future_month in [3, 4, 10, 11] else 1.0
                projected_risk *= future_seasonal_factor
                projected_risk = min(10, max(1, projected_risk))
                
                city_future_risks[future_date.strftime('%Y-%m-%d')] = projected_risk
            
            # Store the current risk as the first day's prediction
            current_city_risks[city.lower()] = city_future_risks[current_date.strftime('%Y-%m-%d')]
            future_risks[city.lower()] = city_future_risks
        
        # Calculate provincial risks
        for province in recent_data['province'].unique():
            province_mask = recent_data['province'] == province
            province_data = recent_data[province_mask].copy()
            flu_cases_per_100k = (province_data['flu_cases'].sum() / province_data['population'].sum()) * 100000
            base_risk = min(10, max(1, flu_cases_per_100k / 50))
            risk = base_risk * 1.2 * seasonal_factor
            provincial_risks[province] = min(10, max(1, risk))
        
        # Calculate national risk
        flu_cases_per_100k = (recent_data['flu_cases'].sum() / recent_data['population'].sum()) * 100000
        base_risk = min(10, max(1, flu_cases_per_100k / 50))
        national_risk = min(10, max(1, base_risk * 1.3 * seasonal_factor))
        
        return {
            "national_risk": national_risk,
            "current_city_risks": current_city_risks,
            "provincial_risks": provincial_risks,
            "future_risks": future_risks
        }
    except Exception as e:
        print(f"Error calculating flu risk data: {str(e)}")
        raise

@app.get("/api/locations")
async def get_locations():
    try:
        # Read sales data to get available locations
        sales_data_path = os.path.join(os.path.dirname(__file__), "database", "sales_data.csv")
        df = pd.read_csv(sales_data_path)
        locations = df['city'].unique().tolist()
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/survey")
async def submit_survey(response: SurveyResponse):
    conn = sqlite3.connect('flu_app.db')
    c = conn.cursor()
    
    try:
        print(f"Received survey data: {response.dict()}")
        c.execute('''
            INSERT INTO survey_responses (
                age, postal_code, organization, organization_type,
                symptoms, province, submission_id, timezone,
                timestamp, user_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            response.age,
            response.postalCode,
            response.organization,
            response.organizationType,
            response.symptoms,
            response.province,
            response.submissionId,
            response.timezone,
            response.timestamp,
            response.userEmail
        ))
        
        conn.commit()
        return {"message": "Survey submitted successfully"}
    except Exception as e:
        print(f"Error submitting survey: {str(e)}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/surveys")
async def get_surveys(user_email: str):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Get survey responses for the specific user ordered by most recent first
        cursor.execute('''
            SELECT 
                id,
                age,
                postal_code,
                organization,
                organization_type,
                symptoms,
                province,
                submission_id,
                timezone,
                timestamp,
                user_email,
                created_at
            FROM survey_responses 
            WHERE user_email = ?
            ORDER BY created_at DESC
        ''', (user_email,))
        
        surveys = []
        for row in cursor.fetchall():
            surveys.append({
                "id": row[0],
                "age": row[1],
                "postalCode": row[2],
                "organization": row[3],
                "organizationType": row[4],
                "symptoms": row[5],
                "province": row[6],
                "submissionId": row[7],
                "timezone": row[8],
                "timestamp": row[9],
                "userEmail": row[10],
                "createdAt": row[11]
            })
        
        return surveys
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/flu-risk/{location}")
async def get_flu_risk(location: str):
    try:
        data = get_flu_risk_data()
        location_lower = location.lower()
        if location_lower in data["current_city_risks"]:
            return {
                "current_risk": data["current_city_risks"][location_lower],
                "future_risks": data["future_risks"][location_lower]
            }
        raise HTTPException(status_code=404, detail="Location not found")
    except Exception as e:
        print(f"Error getting flu risk for {location}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flu-risk")
async def get_flu_risk():
    try:
        data = get_flu_risk_data()
        return data
    except Exception as e:
        print(f"Error getting flu risk data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Authentication endpoints
@app.post("/api/auth/signup")
async def signup(user: UserSignUp):
    conn = sqlite3.connect('flu_app.db')
    c = conn.cursor()
    try:
        # Check if user already exists
        c.execute("SELECT * FROM users WHERE email = ?", (user.email,))
        existing_user = c.fetchone()
        if existing_user:
            print(f"Signup attempt with existing email: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password (in production, use a proper hashing library)
        password_hash = user.password  # In production, use proper hashing
        
        # Insert new user
        c.execute("""
            INSERT INTO users (name, email, password_hash, city, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user.name, user.email, password_hash, user.city, datetime.now()))
        
        conn.commit()
        return {"message": "User created successfully"}
    except HTTPException as e:
        print(f"HTTP Exception in signup: {e.detail}")
        raise e
    except Exception as e:
        print(f"Unexpected error in signup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/auth/signin")
async def signin(user: UserSignIn):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # First check if email exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        if not cursor.fetchone():
            raise HTTPException(status_code=401, detail="Email not found. Please sign up first.")
        
        # Then check password
        cursor.execute("SELECT id, name, email, city FROM users WHERE email = ? AND password_hash = ?", 
                      (user.email, user.password))  # In production, use proper password verification
        
        user_data = cursor.fetchone()
        if not user_data:
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        return {
            "id": user_data[0],
            "name": user_data[1],
            "email": user_data[2],
            "city": user_data[3]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 