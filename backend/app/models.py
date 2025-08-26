from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class PetSize(enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    EXTRA_LARGE = "extra_large"

class PetType(enum.Enum):
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    RABBIT = "rabbit"
    OTHER = "other"

class AdoptionStatus(enum.Enum):
    AVAILABLE = "available"
    PENDING = "pending"
    ADOPTED = "adopted"
    ON_HOLD = "on_hold"

class ActivityLevel(enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"

class HouseType(enum.Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    CONDO = "condo"
    FARM = "farm"
 
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(20))
    
    preferred_pet_type = Column(Enum(PetType))
    preferred_age_min = Column(Integer)
    preferred_age_max = Column(Integer)
    activity_level = Column(Enum(ActivityLevel))
    has_children = Column(Boolean)
    preferred_breeds = Column(Text)
    house_type = Column(Enum(HouseType))
    
    has_yard = Column(Boolean)
    experience_level = Column(String(50))
    has_other_pets = Column(Boolean)
    preferred_pet_size = Column(Enum(PetSize))
    max_adoption_fee = Column(Float)
    preferred_temperament = Column(Text)
    
    basic_preferences_complete = Column(Boolean, default=False)
    extended_preferences_complete = Column(Boolean, default=False)
    
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(10))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Shelter(Base):
    __tablename__ = "shelters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    website = Column(String(255))
    
    address = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(10), nullable=False)
    
    description = Column(Text)
    capacity = Column(Integer)
    license_number = Column(String(100))
    
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    pets = relationship("Pet", back_populates="shelter")

class Pet(Base):
    __tablename__ = "pets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    pet_type = Column(Enum(PetType), nullable=False)
    breed = Column(String(100))
    age_years = Column(Integer)
    age_months = Column(Integer)
    size = Column(Enum(PetSize), nullable=False)
    weight = Column(Float)
    
    color = Column(String(100))
    gender = Column(String(10))
    is_spayed_neutered = Column(Boolean, default=False)
    
    temperament = Column(Text)
    activity_level = Column(Enum(ActivityLevel))
    good_with_kids = Column(Boolean, default=False)
    good_with_dogs = Column(Boolean, default=False)
    good_with_cats = Column(Boolean, default=False)
    house_trained = Column(Boolean, default=False)
    
    medical_history = Column(Text)
    special_needs = Column(Text)
    vaccination_status = Column(String(50))
    
    adoption_status = Column(Enum(AdoptionStatus), default=AdoptionStatus.AVAILABLE)
    adoption_fee = Column(Float)
    description = Column(Text)
    
    primary_photo_url = Column(String(500))
    additional_photos = Column(Text)
    
    shelter_id = Column(Integer, ForeignKey("shelters.id"), nullable=False)
    shelter = relationship("Shelter", back_populates="pets")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    match_score = Column(Float)

class UserFavorite(Base):
    __tablename__ = "user_favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    pet = relationship("Pet")