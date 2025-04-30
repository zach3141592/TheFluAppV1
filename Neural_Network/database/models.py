from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with predictions
    predictions = relationship("Prediction", back_populates="user")

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