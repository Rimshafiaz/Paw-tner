from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from . import models, schemas, crud, auth
import json

class UserService:

    """Business logic for user operations"""
    
    @staticmethod
    def create_user(db: Session, user_data: schemas.UserCreate) -> models.User:
        """Create user with ALL business logic validation"""
        
        
        existing_user = crud.UserCRUD.get_user_by_email(db, user_data.email)
        existing_shelter = crud.ShelterCRUD.get_shelter_by_email(db, user_data.email)
        
        if existing_user or existing_shelter:
            raise ValueError("Email already registered. Please use a different email address.")
        
        hashed_password = auth.hash_password(user_data.password)
        
        
        user_dict = user_data.dict()
        user_dict["hashed_password"] = hashed_password
        del user_dict["password"]  
        
        db_user = models.User(**user_dict)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> models.User:
        """Get user by ID with business logic validation"""
        user = crud.UserCRUD.get_user(db, user_id)
        if not user:
            raise ValueError("User not found")
        
        
        
        return user
    
    @staticmethod
    def update_user_preferences(
        db: Session, 
        user_id: int, 
        preferences: schemas.UserPreferencesUpdate
    ) -> Optional[models.User]:
        """Update user preferences with business logic"""
        
        update_data = {}

        simple_fields = [
            'preferred_pet_type', 'preferred_age_min', 'preferred_age_max',
            'activity_level', 'has_children', 'house_type', 'has_yard',
            'experience_level', 'has_other_pets', 'preferred_pet_size',
            'max_adoption_fee', 'city', 'state', 'zip_code'
        ]
        
        for field in simple_fields:
            value = getattr(preferences, field, None)
            if value is not None:
                update_data[field] = value
        
        
        if preferences.preferred_breeds:
            update_data['preferred_breeds'] = json.dumps(preferences.preferred_breeds)
        
        if preferences.preferred_temperament:
            update_data['preferred_temperament'] = json.dumps(preferences.preferred_temperament)
        
        
        updated_user = crud.UserCRUD.update_user(db, user_id, update_data)
        
        if not updated_user:
            raise ValueError("User not found")
        
        
        completeness_data = UserService.calculate_completeness_flags(updated_user)
        
        
        final_user = crud.UserCRUD.update_user(db, user_id, completeness_data)
        return final_user
    
    @staticmethod
    def calculate_completeness_flags(user: models.User) -> Dict[str, bool]:
        """Calculate profile completeness flags"""
        
        
        basic_complete = all([
            user.preferred_pet_type is not None,
            user.activity_level is not None,
            user.house_type is not None,
            user.has_children is not None
        ])
        
        
        extended_fields = [
            user.preferred_pet_size,
            user.experience_level,
            user.has_yard,
            user.has_other_pets,
            user.max_adoption_fee,
            user.city,
            user.state
        ]
        
        
        completed_extended = sum(1 for field in extended_fields if field is not None)
        extended_complete = (completed_extended / len(extended_fields)) >= 0.7
        
        return {
            'basic_preferences_complete': basic_complete,
            'extended_preferences_complete': extended_complete
        }
    
    @staticmethod
    def get_profile_completeness(
        db: Session, 
        user_id: int
    ) -> schemas.UserProfileCompleteness:
        """Get detailed profile completeness analysis"""
        
        user = crud.UserCRUD.get_user(db, user_id)
        if not user:
            raise ValueError("User not found")
        
        
        basic_fields = {
            'preferred_pet_type': user.preferred_pet_type,
            'activity_level': user.activity_level,
            'house_type': user.house_type,
            'has_children': user.has_children
        }
        
        extended_fields = {
            'preferred_pet_size': user.preferred_pet_size,
            'experience_level': user.experience_level,
            'has_yard': user.has_yard,
            'has_other_pets': user.has_other_pets,
            'max_adoption_fee': user.max_adoption_fee,
            'city': user.city,
            'state': user.state
        }
        
        basic_completed = sum(1 for v in basic_fields.values() if v is not None)
        basic_percentage = (basic_completed / len(basic_fields)) * 100
        
        extended_completed = sum(1 for v in extended_fields.values() if v is not None)
        extended_percentage = (extended_completed / len(extended_fields)) * 100
        
        missing_basic = [k for k, v in basic_fields.items() if v is None]
        missing_extended = [k for k, v in extended_fields.items() if v is None]
        
        return schemas.UserProfileCompleteness(
            basic_complete=basic_percentage == 100,
            extended_complete=extended_percentage >= 70,
            basic_percentage=basic_percentage,
            extended_percentage=extended_percentage,
            missing_basic_fields=missing_basic,
            missing_extended_fields=missing_extended
        )
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
        
        
        user = crud.UserCRUD.get_user_by_email(db, email)
        if not user:
            return None
            
        if not auth.verify_password(password, user.hashed_password):
            return None
            
        return user
    
    @staticmethod
    def create_user_token(user: models.User) -> str:
        
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "user_type": "user",
            "role": user.role.value if user.role else "adopter",
            "sub": str(user.id)
        }
        return auth.create_access_token(token_data)

class PetService:
    """Business logic for pet operations"""
    
    @staticmethod
    def get_pets_with_completeness(db: Session, **filters) -> List[Dict]:
        """Get pets with calculated profile completeness"""
        pets = crud.PetCRUD.get_pets(db, **filters)
        
        result = []
        for pet in pets:
            completeness_score = PetService.calculate_pet_completeness(pet)
            completeness_level = PetService.get_completeness_level(completeness_score)
            
            pet_dict = {
                "pet": pet,
                "completeness_score": completeness_score,
                "completeness_level": completeness_level
            }
            result.append(pet_dict)
        
        return result
    
    @staticmethod
    def get_pets_formatted_for_api(db: Session, include_completeness: bool = False, **filters):
        """Get pets formatted for API response (handles both simple and completeness modes)"""
        
        if include_completeness:
            pets_with_completeness = PetService.get_pets_with_completeness(db, **filters)
            
            pet_summaries = []
            for item in pets_with_completeness:
                pet = item["pet"]
                summary = schemas.PetSummary.from_orm(pet)
                summary.completeness_level = item["completeness_level"]
                summary.completeness_score = item["completeness_score"]
                pet_summaries.append(summary)
            
            return pet_summaries
        else:
            pets = crud.PetCRUD.get_pets(db, **filters)
            pet_summaries = [schemas.PetSummary.from_orm(pet) for pet in pets]
            return pet_summaries
    
    @staticmethod
    def get_pet_by_id(db: Session, pet_id: int) -> models.Pet:
        """Get pet by ID with business logic validation"""
        pet = crud.PetCRUD.get_pet(db, pet_id)
        if not pet:
            raise ValueError("Pet not found")
        
        
        return pet
    
    @staticmethod
    def get_pet_with_contact(db: Session, pet_id: int) -> models.Pet:
        """Get pet with shelter contact information"""
        pet = crud.PetCRUD.get_pet_with_shelter(db, pet_id)
        if not pet:
            raise ValueError("Pet not found")
        
        return pet
    
    @staticmethod
    def _validate_pet_data(age_years=None, adoption_fee=None, temperament=None):
        """Shared validation logic for create and update"""
        if age_years is not None:
            if age_years < 0:
                raise ValueError("Pet age cannot be negative")
            if age_years > 30:
                raise ValueError("Pet age seems unrealistic (maximum 30 years)")
        
        if adoption_fee is not None:
            if adoption_fee < 0:
                raise ValueError("Adoption fee cannot be negative")
            if adoption_fee > 10000:
                raise ValueError("Adoption fee seems unrealistic (maximum $10,000)")
        
        if temperament is not None:
            if len(temperament.strip()) < 3:
                raise ValueError("Temperament description must be at least 3 characters")
            if len(temperament) > 1000:
                raise ValueError("Temperament description too long (maximum 1000 characters)")
    
    @staticmethod
    def create_pet(db: Session, pet_data: schemas.PetCreate) -> models.Pet:
        """Create pet with business logic validation"""
        
 
        PetService._validate_pet_data(pet_data.age_years, pet_data.adoption_fee, pet_data.temperament)
        

        return crud.PetCRUD.create_pet(db, pet_data)
    
    @staticmethod
    def update_pet(db: Session, pet_id: int, update_data: schemas.PetUpdate) -> models.Pet:
        """Update pet with business logic validation"""
        
        existing_pet = crud.PetCRUD.get_pet(db, pet_id)
        if not existing_pet:
            raise ValueError("Pet not found")
        
        PetService._validate_pet_data(update_data.age_years, update_data.adoption_fee, update_data.temperament)
        

        updated_pet = crud.PetCRUD.update_pet(db, pet_id, update_data)
        return updated_pet
    
    @staticmethod
    def delete_pet(db: Session, pet_id: int) -> dict:
        """Delete pet with business logic validation"""
        
        existing_pet = crud.PetCRUD.get_pet(db, pet_id)
        if not existing_pet:
            raise ValueError("Pet not found")
        

        success = crud.PetCRUD.delete_pet(db, pet_id)
        if not success:
            raise Exception("Failed to delete pet")  
        
        return {"message": "Pet deleted successfully"}
    
    @staticmethod
    def calculate_pet_completeness(pet: models.Pet) -> float:
        """Calculate how complete a pet's profile is"""
        total_fields = 0
        completed_fields = 0
        
        essential_fields = [
            'name', 'pet_type', 'breed', 'age_years', 'size', 'gender',
            'vaccination_status', 'is_spayed_neutered', 'medical_history',
            'temperament', 'activity_level', 'adoption_fee', 'description', 'primary_photo_url'
        ]
        
        optional_fields = [
            'age_months', 'weight', 'color', 'house_trained', 'special_needs', 'additional_photos'
        ]
        
        all_fields = essential_fields + optional_fields
        
        for field in all_fields:
            total_fields += 1
            value = getattr(pet, field, None)
            
            if value is not None and value != "" and value != False:
                completed_fields += 1
        
        return (completed_fields / total_fields) * 100 if total_fields > 0 else 0
    
    @staticmethod
    def get_completeness_level(score: float) -> schemas.ProfileCompleteness:
        """Convert completeness score to level"""
        if score >= 90:
            return schemas.ProfileCompleteness.COMPREHENSIVE
        elif score >= 70:
            return schemas.ProfileCompleteness.DETAILED
        elif score >= 50:
            return schemas.ProfileCompleteness.BASIC
        else:
            return schemas.ProfileCompleteness.MINIMAL

class MatchingService:
    """Business logic for AI pet matching"""
    
    @staticmethod
    def calculate_user_pet_compatibility(user: models.User, pet: models.Pet) -> float:
        """Calculate compatibility score between user and pet"""
        
        if not UserService.calculate_completeness_flags(user)['basic_preferences_complete']:
            return 0.0  
        
        score = 50.0  
        
        if user.preferred_pet_type and user.preferred_pet_type == pet.pet_type:
            score += 25
        elif user.preferred_pet_type and user.preferred_pet_type != pet.pet_type:
            score -= 30  
        
        if user.activity_level and user.activity_level == pet.activity_level:
            score += 20
        
        if user.preferred_age_min and user.preferred_age_max:
            if user.preferred_age_min <= pet.age_years <= user.preferred_age_max:
                score += 15
            else:
                score -= 10
        
        if user.has_children is not None:
            if user.has_children and pet.good_with_kids:
                score += 15
            elif user.has_children and not pet.good_with_kids:
                score -= 25  
        
        if user.preferred_pet_size and user.preferred_pet_size == pet.size:
            score += 10
        
        if user.max_adoption_fee and pet.adoption_fee:
            if pet.adoption_fee <= user.max_adoption_fee:
                score += 5
            else:
                score -= 15  
        
        return max(0.0, min(100.0, score))
    
    @staticmethod
    def get_user_matches(db: Session, user_id: int, limit: int = 20) -> List[Dict]:
        """Get AI-matched pets for a user"""
        
        user = crud.UserCRUD.get_user(db, user_id)
        if not user:
            return []
        
        if not UserService.calculate_completeness_flags(user)['basic_preferences_complete']:
            return []

        pets = crud.PetCRUD.get_pets(
            db, 
            adoption_status=models.AdoptionStatus.AVAILABLE,
            limit=100 
        )
        
        matches = []
        for pet in pets:
            compatibility = MatchingService.calculate_user_pet_compatibility(user, pet)
            if compatibility > 30: 
                matches.append({
                    "pet": pet,
                    "compatibility_score": compatibility
                })
        
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return matches[:limit]
    
    @staticmethod
    def get_user_matches_with_validation(db: Session, user_id: int, limit: int):
        """Get matches with full business logic validation"""
        
        user = crud.UserCRUD.get_user(db, user_id)
        if not user:
            raise ValueError("User not found")
        
        completeness_flags = UserService.calculate_completeness_flags(user)
        if not completeness_flags['basic_preferences_complete']:
            return {
                "message": "Please complete your basic preferences to get AI matches",
                "matches": [],
                "requires_preferences": True
            }
        
        matches = MatchingService.get_user_matches(db, user_id, limit)
        return {
            "matches": matches,
            "total": len(matches),
            "requires_preferences": False
        }

class ShelterService:
    """Business logic for shelter operations"""
    
    @staticmethod
    def get_shelters(db: Session, skip: int = 0, limit: int = 20) -> List[models.Shelter]:
        """Get shelters with business logic"""
        return crud.ShelterCRUD.get_shelters(db, skip, limit)
    
    
    @staticmethod
    def register_shelter(db: Session, shelter_data: schemas.ShelterRegister) -> models.Shelter:
        existing_user = crud.UserCRUD.get_user_by_email(db, shelter_data.email)
        existing_shelter = crud.ShelterCRUD.get_shelter_by_email(db, shelter_data.email)
        
        if existing_user or existing_shelter:
            raise ValueError("Email already registered. Please use a different email address.")
        
        hashed_password = auth.hash_password(shelter_data.password)
        
        shelter_dict = shelter_data.dict()
        shelter_dict["hashed_password"] = hashed_password
        shelter_dict["is_verified"] = True
        del shelter_dict["password"]
        
        db_shelter = models.Shelter(**shelter_dict)
        db.add(db_shelter)
        db.commit()
        db.refresh(db_shelter)
        
        return db_shelter
    
    @staticmethod
    def authenticate_shelter(db: Session, email: str, password: str) -> Optional[models.Shelter]:
        """Authenticate shelter login"""
        
        shelter = crud.ShelterCRUD.get_shelter_by_email(db, email)
        if not shelter:
            return None
            
        if not auth.verify_password(password, shelter.hashed_password):
            return None
            
        return shelter
    
    @staticmethod
    def create_shelter_token(shelter: models.Shelter) -> str:
        """Create JWT token for shelter"""
        token_data = {
            "user_id": shelter.id,
            "email": shelter.email,
            "user_type": "shelter",
            "role": "shelter",
            "sub": str(shelter.id)
        }
        return auth.create_access_token(token_data)