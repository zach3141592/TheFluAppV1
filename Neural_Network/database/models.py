from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    city = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with survey responses
    survey_responses = relationship("SurveyResponse", back_populates="user")

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    postal_code = Column(String, nullable=False)
    organization = Column(String, nullable=False)
    organization_type = Column(String, nullable=False)
    symptoms = Column(String, nullable=False)
    province = Column(String, nullable=False)
    submission_id = Column(String, nullable=False)
    timezone = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    user_email = Column(String, ForeignKey("users.email"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with user
    user = relationship("User", back_populates="survey_responses")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location = Column(String)
    risk_score = Column(Float)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    weather_data = Column(String)  # Store as JSON string
    population_data = Column(String)  # Store as JSON string
    
    # Relationship with user
    user = relationship("User", back_populates="predictions")

class LocationData(Base):
    __tablename__ = "location_data"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, unique=True, index=True)
    population = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)

class SalesData(Base):
    __tablename__ = "sales_data"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    province = Column(String)
    date = Column(DateTime)
    sales = Column(Integer)
    flu_cases = Column(Integer)
    population = Column(Integer)
    land_area = Column(Float) 