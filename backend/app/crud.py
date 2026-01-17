from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from . import models, schemas

class PetCRUD:
    
    @staticmethod
    def get_pet(db: Session, pet_id: int) -> Optional[models.Pet]:
        return db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    
    @staticmethod
    def get_pet_with_shelter(db: Session, pet_id: int) -> Optional[models.Pet]:
        """Get a pet with shelter information for contact purposes"""
        return db.query(models.Pet).options(
            joinedload(models.Pet.shelter)
        ).filter(models.Pet.id == pet_id).first()
    
    @staticmethod
    def _apply_pet_filters(query, pet_type=None, size=None, adoption_status=None, shelter_id=None, 
                          gender=None, age_min=None, age_max=None, city=None, state=None, breed=None):
        if pet_type:
            query = query.filter(models.Pet.pet_type == pet_type)
        if size:
            query = query.filter(models.Pet.size == size)
        if adoption_status:
            query = query.filter(models.Pet.adoption_status == adoption_status)
        if shelter_id:
            query = query.filter(models.Pet.shelter_id == shelter_id)
        
        
        if gender:
            query = query.filter(models.Pet.gender == gender)
        if breed:
            query = query.filter(models.Pet.breed.ilike(f"%{breed}%"))
        if age_min is not None:
            query = query.filter(models.Pet.age_years >= age_min)
        if age_max is not None:
            query = query.filter(models.Pet.age_years <= age_max)
        
        
        if city or state:
            query = query.join(models.Shelter)
            if city:
                query = query.filter(models.Shelter.city.ilike(f"%{city}%"))
            if state:
                query = query.filter(models.Shelter.state.ilike(f"%{state}%"))
        
        return query
    
    @staticmethod
    def get_pets(
        db: Session, 
        skip: int = 0, 
        limit: int = 20,
        pet_type: Optional[models.PetType] = None,
        size: Optional[models.PetSize] = None,
        adoption_status: Optional[models.AdoptionStatus] = None,
        shelter_id: Optional[int] = None,
        gender: Optional[str] = None,
        age_min: Optional[int] = None,
        age_max: Optional[int] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        breed: Optional[str] = None
    ) -> List[models.Pet]:
        """Get pets with optional filtering"""
        query = db.query(models.Pet)
        query = PetCRUD._apply_pet_filters(query, pet_type, size, adoption_status, shelter_id,
                                          gender, age_min, age_max, city, state, breed)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_pets_count(
        db: Session,
        pet_type: Optional[models.PetType] = None,
        size: Optional[models.PetSize] = None,
        adoption_status: Optional[models.AdoptionStatus] = None,
        shelter_id: Optional[int] = None,
        gender: Optional[str] = None,
        age_min: Optional[int] = None,
        age_max: Optional[int] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        breed: Optional[str] = None
    ) -> int:
        query = db.query(func.count(models.Pet.id))
        query = PetCRUD._apply_pet_filters(query, pet_type, size, adoption_status, shelter_id,
                                          gender, age_min, age_max, city, state, breed)
        return query.scalar()
    
    @staticmethod
    def get_pets_by_shelter(db: Session, shelter_id: int, adoption_status: Optional[str] = None) -> List[models.Pet]:
        query = db.query(models.Pet).filter(models.Pet.shelter_id == shelter_id)
        if adoption_status:
            if adoption_status == "available":
                query = query.filter(models.Pet.adoption_status == models.AdoptionStatus.AVAILABLE)
            elif adoption_status == "adopted":
                query = query.filter(models.Pet.adoption_status == models.AdoptionStatus.ADOPTED)
            elif adoption_status == "pending":
                query = query.filter(models.Pet.adoption_status == models.AdoptionStatus.PENDING)
        return query.all()
    
    @staticmethod
    def create_pet(db: Session, pet: schemas.PetCreate) -> models.Pet:
        """Create a new pet"""
        db_pet = models.Pet(**pet.dict())
        db.add(db_pet)
        db.commit()
        db.refresh(db_pet)
        return db_pet
    
    @staticmethod
    def update_pet(db: Session, pet_id: int, pet_update: schemas.PetUpdate) -> Optional[models.Pet]:
        """Update an existing pet"""
        db_pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
        if not db_pet:
            return None
        
        update_data = pet_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_pet, field):
                setattr(db_pet, field, value)
        
        db.commit()
        db.refresh(db_pet)
        return db_pet
    
    @staticmethod
    def delete_pet(db: Session, pet_id: int) -> bool:
        """Delete a pet"""
        db_pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
        if not db_pet:
            return False
        
        db.delete(db_pet)
        db.commit()
        return True

# Shelter CRUD operations
class ShelterCRUD:
    
    @staticmethod
    def get_shelter(db: Session, shelter_id: int) -> Optional[models.Shelter]:
        return db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
    
    @staticmethod
    def get_shelters(db: Session, skip: int = 0, limit: int = 20) -> List[models.Shelter]:
        """Get all shelters"""
        return db.query(models.Shelter).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_shelter(db: Session, shelter: schemas.ShelterCreate) -> models.Shelter:
        """Create a new shelter"""
        db_shelter = models.Shelter(**shelter.dict())
        db.add(db_shelter)
        db.commit()
        db.refresh(db_shelter)
        return db_shelter
    
    @staticmethod
    def update_shelter(db: Session, shelter_id: int, shelter_update: dict) -> Optional[models.Shelter]:
        """Update an existing shelter"""
        db_shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
        if not db_shelter:
            return None
        
        
        for field, value in shelter_update.items():
            setattr(db_shelter, field, value)
        
        db.commit()
        db.refresh(db_shelter)
        return db_shelter
    
    @staticmethod
    def get_shelter_by_email(db: Session, email: str) -> Optional[models.Shelter]:
        """Get shelter by email (for authentication) - case insensitive"""
        from sqlalchemy import func
        return db.query(models.Shelter).filter(func.lower(models.Shelter.email) == email.lower().strip()).first()


# User CRUD operations 
class UserCRUD:
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
        """Get user by email - case insensitive"""
        from sqlalchemy import func
        return db.query(models.User).filter(func.lower(models.User.email) == email.lower().strip()).first()
    
    @staticmethod
    def create_user(db: Session, user: schemas.UserCreate) -> models.User:
        """Create a new user"""
        db_user = models.User(**user.dict())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update_user(db: Session, user_id: int, update_data: dict) -> Optional[models.User]:
        """Update user data"""
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            return None
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user
    
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Delete a user"""
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            return False
        
        db.delete(db_user)
        db.commit()
        return True

# UserFavorite CRUD operations
class UserFavoriteCRUD:
    
    @staticmethod
    def add_favorite(db: Session, user_id: int, pet_id: int) -> Optional[models.UserFavorite]:
        """Add a pet to user's favorites"""
        existing = db.query(models.UserFavorite).filter(
            models.UserFavorite.user_id == user_id,
            models.UserFavorite.pet_id == pet_id
        ).first()
        
        if existing:
            return existing  
        
        
        favorite = models.UserFavorite(user_id=user_id, pet_id=pet_id)
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        return favorite
    
    @staticmethod
    def remove_favorite(db: Session, user_id: int, pet_id: int) -> bool:
        """Remove a pet from user's favorites"""
        favorite = db.query(models.UserFavorite).filter(
            models.UserFavorite.user_id == user_id,
            models.UserFavorite.pet_id == pet_id
        ).first()
        
        if not favorite:
            return False  
        
        db.delete(favorite)
        db.commit()
        return True
    
    @staticmethod
    def get_user_favorites(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[models.Pet]:
        """Get all pets favorited by a user"""
        return db.query(models.Pet).join(models.UserFavorite).filter(
            models.UserFavorite.user_id == user_id
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_favorites_count(db: Session, user_id: int) -> int:
        """Get count of user's favorited pets"""
        return db.query(func.count(models.UserFavorite.id)).filter(
            models.UserFavorite.user_id == user_id
        ).scalar()
    
    @staticmethod
    def is_pet_favorited(db: Session, user_id: int, pet_id: int) -> bool:
        """Check if a user has favorited a specific pet"""
        favorite = db.query(models.UserFavorite).filter(
            models.UserFavorite.user_id == user_id,
            models.UserFavorite.pet_id == pet_id
        ).first()
        return favorite is not None
    
    @staticmethod
    def get_pet_favorites_count(db: Session, pet_id: int) -> int:
        """Get how many users have favorited this pet"""
        return db.query(func.count(models.UserFavorite.id)).filter(
            models.UserFavorite.pet_id == pet_id
        ).scalar()