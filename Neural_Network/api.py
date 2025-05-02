from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
import pandas as pd
import os
import random
import uvicorn
import pytz
from dotenv import load_dotenv
import bcrypt
from sqlalchemy.orm import Session
from database.models import Base, User, SurveyResponse
from database.config import engine, SessionLocal

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Initialize database
Base.metadata.create_all(bind=engine)

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
async def submit_survey(response: SurveyResponse, db: Session = Depends(get_db)):
    try:
        # Create new survey response
        db_survey = SurveyResponse(
            age=response.age,
            postal_code=response.postalCode,
            organization=response.organization,
            organization_type=response.organizationType,
            symptoms=response.symptoms,
            province=response.province,
            submission_id=response.submissionId,
            timezone=response.timezone,
            timestamp=response.timestamp,
            user_email=response.userEmail
        )
        db.add(db_survey)
        db.commit()
        db.refresh(db_survey)
        
        return {"message": "Survey submitted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/surveys")
async def get_surveys(user_email: str, db: Session = Depends(get_db)):
    try:
        surveys = db.query(SurveyResponse).filter(SurveyResponse.user_email == user_email).all()
        return [
            {
                "id": survey.id,
                "age": survey.age,
                "postalCode": survey.postal_code,
                "organization": survey.organization,
                "organizationType": survey.organization_type,
                "symptoms": survey.symptoms,
                "province": survey.province,
                "submissionId": survey.submission_id,
                "timezone": survey.timezone,
                "timestamp": survey.timestamp,
                "userEmail": survey.user_email,
                "createdAt": survey.created_at
            }
            for survey in surveys
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
async def signup(user: UserSignUp, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        db_user = User(
            name=user.name,
            email=user.email,
            password_hash=hash_password(user.password),
            city=user.city
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {"message": "User created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/signin")
async def signin(user: UserSignIn, db: Session = Depends(get_db)):
    try:
        # Find user
        db_user = db.query(User).filter(User.email == user.email).first()
        if not db_user:
            raise HTTPException(status_code=401, detail="Email not found")
        
        # Verify password
        if not verify_password(user.password, db_user.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        return {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "city": db_user.city
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 