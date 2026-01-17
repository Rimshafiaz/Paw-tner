from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from . import models, schemas, crud, auth
import json

class UserService:

    
    @staticmethod
    def create_user(db: Session, user_data: schemas.UserCreate) -> models.User:
        
        
        email_lower = user_data.email.lower().strip()
        existing_user = crud.UserCRUD.get_user_by_email(db, email_lower)
        existing_shelter = crud.ShelterCRUD.get_shelter_by_email(db, email_lower)
        
        if existing_user:
            raise ValueError("This email is already registered as an adopter account. Please use a different email or try logging in instead.")
        if existing_shelter:
            raise ValueError("This email is already registered as a shelter account. Please use a different email or log in to your shelter account.")
        
        hashed_password = auth.hash_password(user_data.password)
        
        
        user_dict = user_data.dict()
        user_dict["email"] = email_lower
        user_dict["hashed_password"] = hashed_password
        del user_dict["password"]  
        
        db_user = models.User(**user_dict)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> models.User:
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
        email_lower = email.lower().strip()
        user = crud.UserCRUD.get_user_by_email(db, email_lower)
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
    
    @staticmethod
    def get_pets_with_completeness(db: Session, **filters) -> List[Dict]:
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
        
        if temperament is not None and temperament:
            temperament_str = str(temperament).strip()
            if len(temperament_str) < 3:
                raise ValueError("Temperament description must be at least 3 characters")
            if len(temperament_str) > 1000:
                raise ValueError("Temperament description too long (maximum 1000 characters)")
    
    @staticmethod
    def create_pet(db: Session, pet_data: schemas.PetCreate) -> models.Pet:
        PetService._validate_pet_data(pet_data.age_years, pet_data.adoption_fee, pet_data.temperament)
        return crud.PetCRUD.create_pet(db, pet_data)
    
    @staticmethod
    def update_pet(db: Session, pet_id: int, update_data: schemas.PetUpdate) -> models.Pet:
        
        existing_pet = crud.PetCRUD.get_pet(db, pet_id)
        if not existing_pet:
            raise ValueError("Pet not found")
        
        PetService._validate_pet_data(update_data.age_years, update_data.adoption_fee, update_data.temperament)
        

        updated_pet = crud.PetCRUD.update_pet(db, pet_id, update_data)
        return updated_pet
    
    @staticmethod
    def delete_pet(db: Session, pet_id: int) -> dict:
        
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
    
    @staticmethod
    def calculate_user_pet_compatibility(user: models.User, pet: models.Pet) -> float:
        """Calculate compatibility score between user and pet"""
        
        completeness_flags = UserService.calculate_completeness_flags(user)
        
        if not completeness_flags['basic_preferences_complete']:
            return 0.0
        
        score = 50.0  
        
        if user.preferred_pet_type and user.preferred_pet_type != pet.pet_type:
            return 0.0
        
        if user.preferred_pet_type and user.preferred_pet_type == pet.pet_type:
            score += 25  
        
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
                pet_summary = schemas.PetSummary.from_orm(pet)
                matches.append({
                    "pet": pet_summary,
                    "compatibility_score": compatibility
                })
        
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return matches[:limit]
    
    @staticmethod
    def get_user_matches_with_validation(db: Session, user_id: int, limit: int):
        
        user = crud.UserCRUD.get_user(db, user_id)
        if not user:
            raise ValueError("User not found")
        
        completeness_flags = UserService.calculate_completeness_flags(user)
        if not completeness_flags['basic_preferences_complete']:
            return {
                "message": "Please complete your basic preferences to get matches",
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
    
    @staticmethod
    def get_shelters(db: Session, skip: int = 0, limit: int = 20) -> List[models.Shelter]:
        return crud.ShelterCRUD.get_shelters(db, skip, limit)
    
    
    @staticmethod
    def register_shelter(db: Session, shelter_data: schemas.ShelterRegister) -> models.Shelter:
        email_lower = shelter_data.email.lower().strip()
        existing_user = crud.UserCRUD.get_user_by_email(db, email_lower)
        existing_shelter = crud.ShelterCRUD.get_shelter_by_email(db, email_lower)
        
        if existing_user:
            raise ValueError("This email is already registered as an adopter account. Please use a different email or log in to your adopter account.")
        if existing_shelter:
            raise ValueError("This email is already registered as a shelter account. Please use a different email or try logging in instead.")
        
        hashed_password = auth.hash_password(shelter_data.password)
        
        shelter_dict = shelter_data.dict()
        shelter_dict["email"] = email_lower
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
        email_lower = email.lower().strip()
        shelter = crud.ShelterCRUD.get_shelter_by_email(db, email_lower)
        if not shelter:
            return None
            
        if not auth.verify_password(password, shelter.hashed_password):
            return None
            
        return shelter
    
    @staticmethod
    def create_shelter_token(shelter: models.Shelter) -> str:
        token_data = {
            "user_id": shelter.id,
            "email": shelter.email,
            "user_type": "shelter",
            "role": "shelter",
            "sub": str(shelter.id)
        }
        return auth.create_access_token(token_data)


class DuplicateDetectionService:
    """Service to detect potential duplicate pet listings"""
    
    @staticmethod
    def calculate_pet_similarity(pet1: dict, pet2: dict) -> float:
        """Calculate similarity score between two pets (0-100%)"""
        similarity_score = 0.0
        total_weight = 0.0
        
        
        name_weight = 30.0
        if pet1.get('name', '').lower() == pet2.get('name', '').lower():
            similarity_score += name_weight
        elif DuplicateDetectionService._fuzzy_match(pet1.get('name', ''), pet2.get('name', '')):
            similarity_score += name_weight * 0.7
        total_weight += name_weight
        
        
        breed_weight = 25.0
        if pet1.get('breed', '').lower() == pet2.get('breed', '').lower():
            similarity_score += breed_weight
        elif DuplicateDetectionService._fuzzy_match(pet1.get('breed', ''), pet2.get('breed', '')):
            similarity_score += breed_weight * 0.6
        total_weight += breed_weight
        
       
        age_weight = 20.0
        age1_months = (pet1.get('age_years', 0) or 0) * 12 + (pet1.get('age_months', 0) or 0)
        age2_months = (pet2.get('age_years', 0) or 0) * 12 + (pet2.get('age_months', 0) or 0)
        age_diff = abs(age1_months - age2_months)
        if age_diff <= 6:
            similarity_score += age_weight * (1 - age_diff / 12)
        total_weight += age_weight
        
        
        size_weight = 10.0
        if pet1.get('size') == pet2.get('size'):
            similarity_score += size_weight
        total_weight += size_weight
        
        
        color_weight = 10.0
        if pet1.get('color', '').lower() == pet2.get('color', '').lower():
            similarity_score += color_weight
        elif DuplicateDetectionService._fuzzy_match(pet1.get('color', ''), pet2.get('color', '')):
            similarity_score += color_weight * 0.5
        total_weight += color_weight
        
        
        gender_weight = 5.0
        if pet1.get('gender', '').lower() == pet2.get('gender', '').lower():
            similarity_score += gender_weight
        total_weight += gender_weight
        
        return (similarity_score / total_weight) * 100 if total_weight > 0 else 0.0
    
    @staticmethod
    def _fuzzy_match(str1: str, str2: str, threshold: float = 0.8) -> bool:
        """Simple fuzzy string matching"""
        if not str1 or not str2:
            return False
        
        str1, str2 = str1.lower().strip(), str2.lower().strip()
        if len(str1) == 0 or len(str2) == 0:
            return False

        shorter, longer = (str1, str2) if len(str1) <= len(str2) else (str2, str1)

        if shorter in longer:
            return True
        
        
        common_chars = set(shorter) & set(longer)
        similarity = len(common_chars) / max(len(set(shorter)), len(set(longer)))
        
        return similarity >= threshold
    
    @staticmethod
    def check_for_duplicates(db: Session, shelter_id: int, new_pet_data: dict, threshold: float = 85.0) -> dict:
        """
        Check if new pet is similar to existing pets from same shelter
        Returns: {"is_duplicate": bool, "similar_pets": list, "max_similarity": float, "high_similarity_count": int, "limit_exceeded": bool}
        """
        existing_pets = crud.PetCRUD.get_pets_by_shelter(
            db=db, 
            shelter_id=shelter_id,
            adoption_status="available"
        )
        
        similar_pets = []
        max_similarity = 0.0
        high_similarity_count = 0
        
        for existing_pet in existing_pets:
            existing_pet_dict = {
                'name': existing_pet.name,
                'breed': existing_pet.breed,
                'age_years': existing_pet.age_years,
                'age_months': existing_pet.age_months,
                'size': existing_pet.size.value if existing_pet.size else None,
                'color': existing_pet.color,
                'gender': existing_pet.gender
            }
            
            similarity = DuplicateDetectionService.calculate_pet_similarity(new_pet_data, existing_pet_dict)
            
            if similarity >= threshold:
                similar_pets.append({
                    'pet_id': existing_pet.id,
                    'name': existing_pet.name,
                    'breed': existing_pet.breed,
                    'age_display': f"{existing_pet.age_years} years, {existing_pet.age_months or 0} months",
                    'similarity_score': round(similarity, 1)
                })
                
                if similarity >= 90.0:
                    high_similarity_count += 1
                    
            max_similarity = max(max_similarity, similarity)
        
        HIGH_SIMILARITY_LIMIT = 3
        limit_exceeded = high_similarity_count >= HIGH_SIMILARITY_LIMIT and max_similarity >= 90.0
        
        return {
            'is_duplicate': len(similar_pets) > 0,
            'similar_pets': similar_pets,
            'max_similarity': round(max_similarity, 1),
            'high_similarity_count': high_similarity_count,
            'limit_exceeded': limit_exceeded,
            'similarity_limit': HIGH_SIMILARITY_LIMIT
        }