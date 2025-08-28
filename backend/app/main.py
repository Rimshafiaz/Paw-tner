from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import get_db, engine, create_tables, recreate_tables
from .models import User, Pet, Shelter, UserFavorite
from . import schemas, crud, services, models
from .auth import get_current_user
from sqlalchemy import text
from typing import Optional, List
import os
import uuid
from pathlib import Path


app = FastAPI(
    title="Paw-tner API",
    description="AI-driven pet matching platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to Paw-tner API!"}



@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/db-test")
def test_database(db: Session = Depends(get_db)):
    try:
        # Test database connection
        result = db.execute(text("SELECT 1"))
        return {"message": "Database connection successful!", "result": result.scalar()}
    except Exception as e:
        return {"message": "Database connection failed!", "error": str(e)}

@app.post("/create-tables")
def create_database_tables():
    try:
        create_tables()
        return {"message": "Database tables created successfully!"}
    except Exception as e:
        return {"message": "Failed to create tables", "error": str(e)}

@app.post("/recreate-tables")
def recreate_database_tables():
    try:
        recreate_tables()
        return {"message": "Database tables recreated successfully!"}
    except Exception as e:
        return {"message": "Failed to recreate tables", "error": str(e)}

# Pet Endpoints
@app.get("/pets", response_model=schemas.PetListResponse)
def get_pets(
    skip: int = 0,
    limit: int = 20,
    pet_type: Optional[str] = None,
    size: Optional[str] = None,
    adoption_status: Optional[str] = None,
    shelter_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    breed: Optional[str] = None,
    include_completeness: bool = False,
    db: Session = Depends(get_db)
):
    """Get all pets with optional filtering and completeness info"""
    try:
        
        pet_summaries = services.PetService.get_pets_formatted_for_api(
            db=db,
            include_completeness=include_completeness,
            skip=skip,
            limit=limit,
            pet_type=pet_type,
            size=size,
            adoption_status=adoption_status,
            shelter_id=shelter_id,
            gender=gender,
            age_min=age_min,
            age_max=age_max,
            city=city,
            state=state,
            breed=breed
        )
        
        total = crud.PetCRUD.get_pets_count(
            db=db,
            pet_type=pet_type,
            size=size,
            adoption_status=adoption_status,
            shelter_id=shelter_id,
            gender=gender,
            age_min=age_min,
            age_max=age_max,
            city=city,
            state=state,
            breed=breed
        )
        
        return schemas.PetListResponse(
            pets=pet_summaries,
            total=total,
            page=skip // limit + 1,
            size=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pets/{pet_id}", response_model=schemas.Pet)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    """Get a specific pet by ID"""
    try:
        
        return services.PetService.get_pet_by_id(db=db, pet_id=pet_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pets/{pet_id}/contact", response_model=schemas.PetWithContact)
def get_pet_with_contact(pet_id: int, db: Session = Depends(get_db)):
    """Get pet details with shelter contact information"""
    try:
        return services.PetService.get_pet_with_contact(db=db, pet_id=pet_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pets", response_model=schemas.Pet)
def create_pet(pet: schemas.PetCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Create a new pet (shelter only)"""
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
            
        if user_role != "shelter":
            raise HTTPException(403, "Only shelters can create pets")
        
        if hasattr(current_user, '__tablename__') and not current_user.is_active:
            raise HTTPException(403, "Account suspended")
        
        return services.PetService.create_pet(db=db, pet_data=pet)
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/pets/{pet_id}", response_model=schemas.Pet)
def update_pet(pet_id: int, pet_update: schemas.PetUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Update an existing pet (shelter only)"""
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
            
        if user_role != "shelter":
            raise HTTPException(403, "Only shelters can update pets")
        
        if hasattr(current_user, '__tablename__') and not current_user.is_active:
            raise HTTPException(403, "Account suspended")
        
        return services.PetService.update_pet(db=db, pet_id=pet_id, update_data=pet_update)
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/pets/{pet_id}")
def delete_pet(pet_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Delete a pet (shelter only)"""
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
            
        if user_role != "shelter":
            raise HTTPException(403, "Only shelters can delete pets")
        
        if hasattr(current_user, '__tablename__') and not current_user.is_active:
            raise HTTPException(403, "Account suspended")
        
        return services.PetService.delete_pet(db=db, pet_id=pet_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pets/{pet_id}/upload-photo")
def upload_pet_photo(pet_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
            
        if user_role != "shelter":
            raise HTTPException(403, "Only shelters can upload pet photos")
        
        if hasattr(current_user, '__tablename__') and not current_user.is_active:
            raise HTTPException(403, "Account suspended")

        pet = crud.PetCRUD.get_pet(db, pet_id)
        if not pet:
            raise HTTPException(404, "Pet not found")
        
        if not file.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        if file.size > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(400, "File too large (max 5MB)")
        
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['jpg', 'jpeg', 'png', 'gif']:
            raise HTTPException(400, "Invalid file type. Use: jpg, jpeg, png, gif")
        
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = Path("uploads/pets") / unique_filename
        
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
        
        photo_url = f"/uploads/pets/{unique_filename}"
        pet.primary_photo_url = photo_url
        db.commit()
        
        return {
            "message": "Photo uploaded successfully",
            "photo_url": photo_url,
            "filename": unique_filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Endpoints
@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    try:
        
        return services.UserService.create_user(db=db, user_data=user)
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=schemas.TokenResponse)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    try:
        user = services.UserService.authenticate_user(
            db=db, 
            email=login_data.email, 
            password=login_data.password
        )
        
        if not user:
            raise HTTPException(401, "Invalid email or password")
        
        access_token = services.UserService.create_user_token(user)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get user profile (own profile only)"""
    try:
        
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own profile"
            )
        
        return services.UserService.get_user_by_id(db=db, user_id=user_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/users/{user_id}/preferences", response_model=schemas.User)
def update_user_preferences(
    user_id: int, 
    preferences: schemas.UserPreferencesUpdate, 
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update user preferences (own preferences only)"""
    try:
        
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own preferences"
            )
        
        return services.UserService.update_user_preferences(
            db=db, 
            user_id=user_id, 
            preferences=preferences
        )
    except ValueError as e:    
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/profile-completeness", response_model=schemas.UserProfileCompleteness)
def get_user_profile_completeness(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get detailed profile completeness information (own profile only)"""
    try:
        
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own profile completeness"
            )
        
        return services.UserService.get_profile_completeness(db=db, user_id=user_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/matches")
def get_user_matches(user_id: int, limit: int = 20, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get AI-matched pets for a user (own matches only)"""
    try:
        
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own matches"
            )
        
        return services.MatchingService.get_user_matches_with_validation(
            db=db, user_id=user_id, limit=limit
        )
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/{user_id}/favorites/{pet_id}")
def add_favorite(user_id: int, pet_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        if current_user.id != user_id:
            raise HTTPException(403, "You can only manage your own favorites")
        
        pet = crud.PetCRUD.get_pet(db, pet_id)
        if not pet:
            raise HTTPException(404, "Pet not found")
        
        favorite = crud.UserFavoriteCRUD.add_favorite(db, user_id, pet_id)
        return {"message": "Pet added to favorites", "favorite_id": favorite.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/users/{user_id}/favorites/{pet_id}")
def remove_favorite(user_id: int, pet_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        if current_user.id != user_id:
            raise HTTPException(403, "You can only manage your own favorites")
        
        success = crud.UserFavoriteCRUD.remove_favorite(db, user_id, pet_id)
        if not success:
            raise HTTPException(404, "Favorite not found")
        
        return {"message": "Pet removed from favorites"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/users/{user_id}/favorites")
def get_user_favorites(user_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        if current_user.id != user_id:
            raise HTTPException(403, "You can only view your own favorites")
        
        favorites = crud.UserFavoriteCRUD.get_user_favorites(db, user_id, skip, limit)
        total = crud.UserFavoriteCRUD.get_user_favorites_count(db, user_id)
        
        pet_summaries = [schemas.PetSummary.from_orm(pet) for pet in favorites]
        
        return {
            "favorites": pet_summaries,
            "total": total,
            "page": skip // limit + 1,
            "size": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/shelters")
def get_shelters(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Get all shelters"""
    try:
        shelters = services.ShelterService.get_shelters(db=db, skip=skip, limit=limit)
        return {"shelters": shelters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/shelters/{shelter_id}/stats")
def get_shelter_stats(shelter_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
        
        if user_role != "shelter" and user_role != "admin":
            raise HTTPException(403, "Shelter or admin access required")
        
        if user_role == "shelter" and current_user.id != shelter_id:
            raise HTTPException(403, "You can only view your own shelter stats")
        
        shelter = crud.ShelterCRUD.get_shelter(db, shelter_id)
        if not shelter:
            raise HTTPException(404, "Shelter not found")
        
        total_pets = db.query(Pet).filter(Pet.shelter_id == shelter_id).count()
        available_pets = db.query(Pet).filter(Pet.shelter_id == shelter_id, Pet.adoption_status == models.AdoptionStatus.AVAILABLE).count()
        adopted_pets = db.query(Pet).filter(Pet.shelter_id == shelter_id, Pet.adoption_status == models.AdoptionStatus.ADOPTED).count()
        pending_pets = db.query(Pet).filter(Pet.shelter_id == shelter_id, Pet.adoption_status == models.AdoptionStatus.PENDING).count()
        
        return {
            "shelter_name": shelter.name,
            "total_pets": total_pets,
            "available_pets": available_pets,
            "adopted_pets": adopted_pets, 
            "pending_pets": pending_pets
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/shelters/register", response_model=schemas.Shelter)
def register_shelter(shelter: schemas.ShelterRegister, db: Session = Depends(get_db)):
    try:
        return services.ShelterService.register_shelter(db=db, shelter_data=shelter)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/admin/shelters/{shelter_id}/suspend")
def suspend_shelter(shelter_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not hasattr(current_user, 'role') or current_user.role.value != "admin":
        raise HTTPException(403, "Admin access required")
    
    shelter = crud.ShelterCRUD.get_shelter(db, shelter_id)
    if not shelter:
        raise HTTPException(404, "Shelter not found")
    
    shelter.is_active = False
    db.commit()
    return {"message": "Shelter suspended"}

@app.put("/admin/shelters/{shelter_id}/reactivate")
def reactivate_shelter(shelter_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not hasattr(current_user, 'role') or current_user.role.value != "admin":
        raise HTTPException(403, "Admin access required")
    
    shelter = crud.ShelterCRUD.get_shelter(db, shelter_id)
    if not shelter:
        raise HTTPException(404, "Shelter not found")
    
    shelter.is_active = True
    db.commit()
    return {"message": "Shelter reactivated"}

@app.post("/shelters/login", response_model=schemas.TokenResponse)
def shelter_login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Shelter login endpoint"""
    try:
        shelter = services.ShelterService.authenticate_shelter(
            db=db,
            email=login_data.email,
            password=login_data.password
        )
        
        if not shelter:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        access_token = services.ShelterService.create_shelter_token(shelter)
        
        # Convert shelter to user-like object for token response
        shelter_as_user = {
            "id": shelter.id,
            "email": shelter.email,
            "username": shelter.name,  
            "full_name": shelter.name,
            "phone": shelter.phone,
            "role": "shelter",
            "basic_preferences_complete": False,
            "extended_preferences_complete": False,
            "created_at": shelter.created_at,
            "preferred_pet_type": None,
            "activity_level": None,
            "house_type": None
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": shelter_as_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)