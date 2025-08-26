from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .models import PetSize, PetType, AdoptionStatus, ActivityLevel, HouseType
import enum


class ProfileCompleteness(enum.Enum):
    COMPREHENSIVE = "comprehensive"      
    DETAILED = "detailed"                
    BASIC = "basic"                     
    MINIMAL = "minimal"                 


class PetBase(BaseModel):
    name: str
    pet_type: PetType
    breed: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    size: PetSize
    weight: Optional[float] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    is_spayed_neutered: Optional[bool] = False
    temperament: Optional[str] = None
    activity_level: Optional[ActivityLevel] = None
    good_with_kids: Optional[bool] = False
    good_with_dogs: Optional[bool] = False
    good_with_cats: Optional[bool] = False
    house_trained: Optional[bool] = False
    medical_history: Optional[str] = None
    special_needs: Optional[str] = None
    vaccination_status: Optional[str] = None
    adoption_status: Optional[AdoptionStatus] = AdoptionStatus.AVAILABLE
    adoption_fee: Optional[float] = None
    description: Optional[str] = None
    primary_photo_url: Optional[str] = None
    additional_photos: Optional[str] = None
    shelter_id: int

class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    weight: Optional[float] = None
    color: Optional[str] = None
    is_spayed_neutered: Optional[bool] = None
    temperament: Optional[str] = None
    activity_level: Optional[ActivityLevel] = None
    good_with_kids: Optional[bool] = None
    good_with_dogs: Optional[bool] = None
    good_with_cats: Optional[bool] = None
    house_trained: Optional[bool] = None
    medical_history: Optional[str] = None
    special_needs: Optional[str] = None
    vaccination_status: Optional[str] = None
    adoption_status: Optional[AdoptionStatus] = None
    adoption_fee: Optional[float] = None
    description: Optional[str] = None
    primary_photo_url: Optional[str] = None
    additional_photos: Optional[str] = None


class Pet(PetBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    match_score: Optional[float] = None
    
    class Config:
        from_attributes = True


class PetSummary(BaseModel):
    id: int
    name: str
    pet_type: PetType
    breed: Optional[str] = None
    age_years: Optional[int] = None
    size: PetSize
    adoption_status: AdoptionStatus
    primary_photo_url: Optional[str] = None
    shelter_id: int
    
  
    completeness_score: Optional[float] = None
    completeness_level: Optional[ProfileCompleteness] = None
    
    class Config:
        from_attributes = True


class PetListResponse(BaseModel):
    pets: List[PetSummary]
    total: int
    page: int
    size: int


class ShelterBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: str
    state: str
    zip_code: str
    description: Optional[str] = None
    capacity: Optional[int] = None
    license_number: Optional[str] = None

class ShelterCreate(ShelterBase):
    pass

class Shelter(ShelterBase):
    id: int
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class BasicPreferences(BaseModel):
    preferred_pet_type: Optional[PetType] = None
    preferred_age_min: Optional[int] = None
    preferred_age_max: Optional[int] = None
    activity_level: Optional[ActivityLevel] = None
    has_children: Optional[bool] = None
    preferred_breeds: Optional[List[str]] = None
    house_type: Optional[HouseType] = None


class ExtendedPreferences(BaseModel):
    has_yard: Optional[bool] = None
    experience_level: Optional[str] = None
    has_other_pets: Optional[bool] = None
    preferred_pet_size: Optional[PetSize] = None
    max_adoption_fee: Optional[float] = None
    preferred_temperament: Optional[List[str]] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class UserPreferencesUpdate(BaseModel):
    # Basic preferences
    preferred_pet_type: Optional[PetType] = None
    preferred_age_min: Optional[int] = None
    preferred_age_max: Optional[int] = None
    activity_level: Optional[ActivityLevel] = None
    has_children: Optional[bool] = None
    preferred_breeds: Optional[List[str]] = None
    house_type: Optional[HouseType] = None
    
    # Extended preferences
    has_yard: Optional[bool] = None
    experience_level: Optional[str] = None
    has_other_pets: Optional[bool] = None
    preferred_pet_size: Optional[PetSize] = None
    max_adoption_fee: Optional[float] = None
    preferred_temperament: Optional[List[str]] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class User(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    phone: Optional[str] = None
    basic_preferences_complete: bool = False
    extended_preferences_complete: bool = False
    created_at: datetime
    
    # Include preferences if they exist
    preferred_pet_type: Optional[PetType] = None
    activity_level: Optional[ActivityLevel] = None
    house_type: Optional[HouseType] = None
    
    class Config:
        from_attributes = True

class UserProfileCompleteness(BaseModel):
    basic_complete: bool
    extended_complete: bool
    basic_percentage: float
    extended_percentage: float
    missing_basic_fields: List[str]
    missing_extended_fields: List[str]