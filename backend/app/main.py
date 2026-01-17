from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import get_db, engine, create_tables, recreate_tables
from .models import User, Pet, Shelter, UserFavorite
from . import schemas, crud, services, models
from .auth import get_current_user
from sqlalchemy import text
from typing import Optional, List
from pydantic import ValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import uuid
from pathlib import Path


app = FastAPI(
    title="Paw-tner API",
    description="Pet matching platform API",
    version="1.0.0"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    print(f"Validation error: {exc}")
    print(f"Validation error details: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to Paw-tner API!"}



@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


@app.get("/db-test", tags=["Database"])
def test_database(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        return {"message": "Database connection successful!", "result": result.scalar()}
    except Exception as e:
        return {"message": "Database connection failed!", "error": str(e)}

@app.post("/create-tables", tags=["Database"])
def create_database_tables():
    try:
        create_tables()
        return {"message": "Database tables created successfully!"}
    except Exception as e:
        return {"message": "Failed to create tables", "error": str(e)}
    


@app.get("/migrate-database")
def migrate_database():
    """Apply pending database migrations safely - only adds new tables/columns, never deletes data"""
    try:
        from alembic import command
        from alembic.config import Config
        import os
        from pathlib import Path
        
        current_file = Path(__file__).resolve()
        backend_dir = current_file.parent.parent.resolve()
        alembic_cfg_path = backend_dir / "alembic.ini"
        alembic_dir = backend_dir / "alembic"
        
        if not alembic_cfg_path.exists():
            return {
                "message": "Migration failed", 
                "error": f"Alembic config not found at {alembic_cfg_path}",
                "current_dir": str(Path.cwd()),
                "backend_dir": str(backend_dir),
                "file_location": str(current_file)
            }
        
        if not alembic_dir.exists():
            return {
                "message": "Migration failed",
                "error": f"Alembic directory not found at {alembic_dir}",
                "backend_dir": str(backend_dir)
            }
        
        original_cwd = os.getcwd()
        try:
            os.chdir(str(backend_dir))
            
            alembic_cfg = Config(str(alembic_cfg_path))
            
            database_url = os.getenv("DATABASE_URL")
            if database_url:
                alembic_cfg.set_main_option("sqlalchemy.url", database_url)
            
            command.upgrade(alembic_cfg, "head")
            
            return {
                "message": "Database migrations applied successfully!",
                "note": "This only adds new tables/columns. Your existing data is safe."
            }
        finally:
            os.chdir(original_cwd)
            
    except Exception as e:
        import traceback
        return {
            "message": "Failed to run migrations", 
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
            "current_dir": str(Path.cwd()) if 'Path' in dir() else "unknown"
        }

@app.post("/recreate-tables")
def recreate_database_tables():
    """DEPRECATED: Use /migrate-database instead. This method WILL DELETE ALL DATA!"""
    return {
        "message": "This endpoint is deprecated and dangerous!", 
        "error": "Use /migrate-database instead to preserve your data",
        "warning": "This endpoint would delete all your data - migration is the safe way!"
    }

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
def create_pet(
    pet: schemas.PetCreate, 
    override_duplicate: bool = False,
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
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
        
        if not override_duplicate:
            pet_data_dict = {
                'name': pet.name,
                'breed': pet.breed,
                'age_years': pet.age_years,
                'age_months': pet.age_months,
                'size': pet.size.value if pet.size else None,
                'color': pet.color,
                'gender': pet.gender
            }
            
            duplicate_check = services.DuplicateDetectionService.check_for_duplicates(
                db=db,
                shelter_id=current_user.id,
                new_pet_data=pet_data_dict
            )
            
            if duplicate_check['limit_exceeded']:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "type": "similarity_limit_exceeded",
                        "message": f"Too many high-similarity pets. You already have {duplicate_check['high_similarity_count']} pets with 90%+ similarity. Limit: {duplicate_check['similarity_limit']}",
                        "high_similarity_count": duplicate_check['high_similarity_count'],
                        "similarity_limit": duplicate_check['similarity_limit'],
                        "similar_pets": duplicate_check['similar_pets']
                    }
                )
            elif duplicate_check['is_duplicate']:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "type": "duplicate_warning",
                        "message": f"Found {len(duplicate_check['similar_pets'])} similar pet(s)",
                        "similar_pets": duplicate_check['similar_pets'],
                        "max_similarity": duplicate_check['max_similarity'],
                        "high_similarity_count": duplicate_check['high_similarity_count']
                    }
                )
        
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
        
        result = services.PetService.update_pet(db=db, pet_id=pet_id, update_data=pet_update)
        return result
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

@app.delete("/pets/{pet_id}/delete-photo")
def delete_pet_photo(pet_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
            
        if user_role != "shelter":
            raise HTTPException(403, "Only shelters can delete pet photos")
        
        if hasattr(current_user, '__tablename__') and not current_user.is_active:
            raise HTTPException(403, "Account suspended")

        pet = crud.PetCRUD.get_pet(db, pet_id)
        if not pet:
            raise HTTPException(404, f"Pet with ID {pet_id} not found")
            
        if pet.shelter_id != current_user.id:
            raise HTTPException(403, "You can only delete photos for your own pets")
        
        if pet.primary_photo_url and pet.primary_photo_url.startswith('/uploads/'):
            file_path = f"./uploads{pet.primary_photo_url[8:]}" 
            if os.path.exists(file_path):
                os.remove(file_path)
        
        pet.primary_photo_url = None
        db.commit()
        
        return {"message": "Photo deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Endpoints
@app.post("/users", response_model=schemas.User)
@limiter.limit("3/minute")
def create_user(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    try:
        
        return services.UserService.create_user(db=db, user_data=user)
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
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


@app.get("/users/{user_id}/preferences", response_model=schemas.User)
def get_user_preferences(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get user preferences (own preferences only)"""
    try:
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own preferences"
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
        
        result = services.MatchingService.get_user_matches_with_validation(
            db=db, user_id=user_id, limit=limit
        )
        
        return JSONResponse(content=jsonable_encoder(result))
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
        
        shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
        if not shelter:
            raise HTTPException(404, "Shelter not found")
        
        try:
            total_pets = db.execute(text("SELECT COUNT(*) FROM pets WHERE shelter_id = :shelter_id"), {"shelter_id": shelter_id}).scalar() or 0
            available_pets = db.execute(text("SELECT COUNT(*) FROM pets WHERE shelter_id = :shelter_id AND adoption_status = 'AVAILABLE'"), {"shelter_id": shelter_id}).scalar() or 0
            adopted_pets = db.execute(text("SELECT COUNT(*) FROM pets WHERE shelter_id = :shelter_id AND adoption_status = 'ADOPTED'"), {"shelter_id": shelter_id}).scalar() or 0
            pending_pets = db.execute(text("SELECT COUNT(*) FROM pets WHERE shelter_id = :shelter_id AND adoption_status = 'PENDING'"), {"shelter_id": shelter_id}).scalar() or 0
        except Exception as e:
            total_pets = available_pets = adopted_pets = pending_pets = 0
        
        return {
            "shelter_name": shelter.name,
            "total_pets": total_pets,
            "available_pets": available_pets,
            "adopted_pets": adopted_pets, 
            "pending_pets": pending_pets,
            "profile": {
                "id": shelter.id,
                "name": shelter.name,
                "email": shelter.email,
                "phone": shelter.phone or "",
                "city": shelter.city or "",
                "state": shelter.state or "",
                "country": shelter.country or "",
                "address": shelter.address or "",
                "zip_code": shelter.zip_code or "",
                "description": shelter.description or "",
                "capacity": shelter.capacity,
                "contact_hours": shelter.contact_hours or "",
                "website": shelter.website or "",
                "license_number": shelter.license_number or ""
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/shelters/register", response_model=schemas.Shelter)
@limiter.limit("3/minute")
def register_shelter(request: Request, shelter: schemas.ShelterRegister, db: Session = Depends(get_db)):
    try:
        return services.ShelterService.register_shelter(db=db, shelter_data=shelter)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/shelters/{shelter_id}/basic")
def get_shelter_basic_info(shelter_id: int, db: Session = Depends(get_db)):
    try:
        shelter = db.query(models.Shelter).filter(models.Shelter.id == shelter_id).first()
        
        if not shelter:
            raise HTTPException(404, "Shelter not found")
        
        return {
            "id": shelter.id,
            "name": shelter.name,
            "email": shelter.email,
            "phone": shelter.phone or "",
            "city": shelter.city or "",
            "state": shelter.state or "",
            "country": shelter.country or "",
            "address": shelter.address or "",
            "zip_code": shelter.zip_code or "",
            "description": shelter.description or "",
            "capacity": shelter.capacity,
            "contact_hours": shelter.contact_hours or "",
            "website": shelter.website or "",
            "license_number": shelter.license_number or ""
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.put("/shelters/{shelter_id}/profile")
def update_shelter_profile(shelter_id: int, shelter_update: dict, db: Session = Depends(get_db)):
    try:
        shelter = crud.ShelterCRUD.get_shelter(db, shelter_id)
        if not shelter:
            raise HTTPException(404, "Shelter not found")
        
        for field, value in shelter_update.items():
            if hasattr(shelter, field) and field != 'id' and field != 'hashed_password':
                setattr(shelter, field, value)
        
        db.commit()
        db.refresh(shelter)
        
        return {
            "id": shelter.id,
            "name": shelter.name,
            "email": shelter.email,
            "phone": shelter.phone,
            "city": shelter.city,
            "state": shelter.state,
            "country": shelter.country,
            "address": shelter.address,
            "zip_code": shelter.zip_code,
            "description": shelter.description,
            "capacity": shelter.capacity,
            "contact_hours": shelter.contact_hours,
            "website": shelter.website,
            "license_number": shelter.license_number,
            "message": "Profile updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/shelters/{shelter_id}", response_model=schemas.Shelter)
def get_shelter(shelter_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
        
        if user_role == "shelter" and current_user.id != shelter_id:
            raise HTTPException(403, "Can only access your own shelter profile")
        elif user_role != "shelter" and user_role != "admin":
            raise HTTPException(403, "Shelter or admin access required")
            
        shelter = crud.ShelterCRUD.get_shelter(db, shelter_id)
        if not shelter:
            raise HTTPException(404, "Shelter not found")
        return shelter
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@app.put("/shelters/{shelter_id}", response_model=schemas.Shelter)
def update_shelter(shelter_id: int, shelter_update: schemas.ShelterBase, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        user_role = None
        if hasattr(current_user, 'role') and current_user.role:
            user_role = current_user.role.value
        elif hasattr(current_user, '__tablename__') and current_user.__tablename__ == "shelters":
            user_role = "shelter"
        
        if user_role == "shelter" and current_user.id != shelter_id:
            raise HTTPException(403, "Can only update your own shelter profile")
        elif user_role != "shelter" and user_role != "admin":
            raise HTTPException(403, "Shelter or admin access required")
            
        updated_shelter = crud.ShelterCRUD.update_shelter(db, shelter_id, shelter_update.model_dump(exclude_unset=True))
        if not updated_shelter:
            raise HTTPException(404, "Shelter not found")
        return updated_shelter
    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(500, str(e))


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
@limiter.limit("5/minute")
def shelter_login(request: Request, login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
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
