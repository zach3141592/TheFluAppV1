from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import json
import os
from datetime import datetime, timedelta
import sqlite3
from typing import List, Optional, Dict
import hashlib
import re
import pandas as pd
import random

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Database setup
DATABASE_URL = "flu_app.db"

def get_db():
    conn = sqlite3.connect(DATABASE_URL, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DATABASE_URL, check_same_thread=False)
    cursor = conn.cursor()
    
    # Drop existing tables to recreate them
    cursor.execute('DROP TABLE IF EXISTS users')
    cursor.execute('DROP TABLE IF EXISTS survey_responses')
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create survey_responses table with updated schema
    cursor.execute('''
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

class UserCreate(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

# Add a set to track recent submissions
recent_submissions = set()

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

    @validator('age')
    def validate_age(cls, v):
        if v < 0 or v > 120:
            raise ValueError('Age must be between 0 and 120')
        return v

    @validator('postalCode')
    def validate_postal_code(cls, v):
        # Remove spaces and convert to uppercase
        v = v.replace(' ', '').upper()
        # Check if it matches the format A1A1A1
        if not re.match(r'^[A-Z]\d[A-Z]\d[A-Z]\d$', v):
            raise ValueError('Invalid Canadian postal code format')
        return v

    @validator('province')
    def validate_province(cls, v):
        valid_provinces = ['ab', 'bc', 'mb', 'nb', 'nl', 'ns', 'nt', 'nu', 'on', 'pe', 'qc', 'sk', 'yt']
        if v.lower() not in valid_provinces:
            raise ValueError('Invalid province code')
        return v.lower()

    class Config:
        schema_extra = {
            "example": {
                "age": 30,
                "postalCode": "A1A1A1",
                "organization": "Example Hospital",
                "organizationType": "hospital",
                "symptoms": "fever,cough",
                "province": "on",
                "submissionId": "1234567890-abc123",
                "timezone": "America/Toronto",
                "timestamp": "2024-04-01T12:00:00.000Z"
            }
        }

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/api/register")
async def register(user: UserCreate, conn = Depends(get_db)):
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            (user.username, hash_password(user.password), user.email)
        )
        conn.commit()
        return {"message": "User registered successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username or email already exists")

@app.post("/api/login")
async def login(user: UserLogin, conn = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?",
        (user.username,)
    )
    db_user = cursor.fetchone()
    
    if not db_user or db_user["password_hash"] != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "user_id": db_user["id"]}

@app.post("/api/survey")
async def submit_survey(response: SurveyResponse):
    try:
        # Check for duplicate submission
        if response.submissionId in recent_submissions:
            raise HTTPException(status_code=400, detail="Duplicate submission detected")
        
        # Add to recent submissions
        recent_submissions.add(response.submissionId)
        
        # Clean up old submissions (keep last 1000)
        if len(recent_submissions) > 1000:
            recent_submissions.clear()

        # Log the received data for debugging
        print(f"Received survey data with timestamp: {response.timestamp} and timezone: {response.timezone}")

        # Get database connection
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        try:
            # Insert into database with proper timestamp handling
            cursor.execute('''
                INSERT INTO survey_responses 
                (age, postal_code, organization, organization_type, symptoms, province, submission_id, timezone, timestamp, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                response.timestamp  # Use the same timestamp for created_at
            ))
            conn.commit()
            return {"message": "Survey submitted successfully"}
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/{user_id}/surveys")
async def get_user_surveys(user_id: int, conn = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM survey_responses WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    surveys = cursor.fetchall()
    return [dict(survey) for survey in surveys]

@app.get("/api/surveys")
async def get_all_surveys(conn = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM survey_responses 
        ORDER BY created_at DESC
        """
    )
    surveys = cursor.fetchall()
    return [dict(survey) for survey in surveys]

# Load sales data
SALES_DATA_PATH = os.path.join(os.path.dirname(__file__), "Neural_Network", "database", "sales_data.csv")
sales_data = pd.read_csv(SALES_DATA_PATH)
sales_data['date'] = pd.to_datetime(sales_data['date'])

def get_flu_risk_data() -> Dict:
    try:
        # Read sales data
        sales_data_path = os.path.join(os.path.dirname(__file__), "Neural_Network", "database", "sales_data.csv")
        sales_data = pd.read_csv(sales_data_path)
        sales_data['date'] = pd.to_datetime(sales_data['date'])
        
        # Use current date instead of latest date from data
        current_date = datetime.now()
        
        # Get data for the last 7 days
        recent_data = sales_data[sales_data['date'] >= current_date - timedelta(days=7)].copy()
        
        # Calculate seasonal factor (higher in winter months)
        month = current_date.month
        seasonal_factor = 1.5 if month in [12, 1, 2] else 1.2 if month in [3, 4, 10, 11] else 1.0
        
        # Initialize dictionaries for storing results
        current_city_risks = {}
        future_risks = {}
        provincial_risks = {}
        
        # Calculate current city risks and future predictions
        for city in recent_data['city'].unique():
            # Create a copy of the city data to avoid SettingWithCopyWarning
            city_mask = recent_data['city'] == city
            city_data = recent_data[city_mask].copy()
            
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
            city_data.loc[:, 'flu_cases_ma'] = city_data['flu_cases'].rolling(window=7).mean()
            trend = city_data['flu_cases_ma'].pct_change().mean()
            
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
            
            # Calculate average risk for the province
            province_risk = province_data['flu_cases'].mean() / province_data['population'].mean() * 100000
            # Round to 1 decimal place for consistency
            provincial_risks[province] = round(min(10, max(1, province_risk * seasonal_factor)), 1)
        
        # Calculate national risk
        national_risk = recent_data['flu_cases'].mean() / recent_data['population'].mean() * 100000
        national_risk = round(min(10, max(1, national_risk * 1.4 * seasonal_factor)), 1)  # Increased national risk
        
        return {
            "national_risk": national_risk,
            "current_city_risks": current_city_risks,
            "provincial_risks": provincial_risks,
            "future_risks": future_risks
        }
    except Exception as e:
        print(f"Error in get_flu_risk_data: {str(e)}")
        return {
            "national_risk": 6.5,
            "current_city_risks": {},
            "provincial_risks": {},
            "future_risks": {}
        }

@app.get("/api/flu-risk/{location}")
async def get_flu_risk(location: str):
    data = get_flu_risk_data()
    if location in data["current_city_risks"]:
        return {
            "current_risk": data["current_city_risks"][location],
            "future_risks": data["future_risks"][location.lower()]
        }
    raise HTTPException(status_code=404, detail="Location not found")

@app.get("/api/locations")
async def get_locations():
    data = get_flu_risk_data()
    return list(data["current_city_risks"].keys())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 