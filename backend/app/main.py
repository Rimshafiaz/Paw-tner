from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import get_db, engine, create_tables, recreate_tables
from .models import User, Pet, Shelter, UserFavorite
from . import schemas, crud, services
from sqlalchemy import text
from typing import Optional, List


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
def create_pet(pet: schemas.PetCreate, db: Session = Depends(get_db)):
    """Create a new pet"""
    try:
        
        return services.PetService.create_pet(db=db, pet_data=pet)
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/pets/{pet_id}", response_model=schemas.Pet)
def update_pet(pet_id: int, pet_update: schemas.PetUpdate, db: Session = Depends(get_db)):
    """Update an existing pet"""
    try:
        
        return services.PetService.update_pet(db=db, pet_id=pet_id, update_data=pet_update)
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/pets/{pet_id}")
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    """Delete a pet"""
    try:
        
        return services.PetService.delete_pet(db=db, pet_id=pet_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
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

@app.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user profile"""
    try:
        
        return services.UserService.get_user_by_id(db=db, user_id=user_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/users/{user_id}/preferences", response_model=schemas.User)
def update_user_preferences(
    user_id: int, 
    preferences: schemas.UserPreferencesUpdate, 
    db: Session = Depends(get_db)
):
    """Update user preferences (basic or extended)"""
    try:
        
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
def get_user_profile_completeness(user_id: int, db: Session = Depends(get_db)):
    """Get detailed profile completeness information"""
    try:
        
        return services.UserService.get_profile_completeness(db=db, user_id=user_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/matches")
def get_user_matches(user_id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Get AI-matched pets for a user"""
    try:
        
        return services.MatchingService.get_user_matches_with_validation(
            db=db, user_id=user_id, limit=limit
        )
    except ValueError as e:  
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:   
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/shelters")
def get_shelters(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Get all shelters"""
    try:
        shelters = services.ShelterService.get_shelters(db=db, skip=skip, limit=limit)
        return {"shelters": shelters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/shelters", response_model=schemas.Shelter)
def create_shelter(shelter: schemas.ShelterCreate, db: Session = Depends(get_db)):
    """Create a new shelter"""
    try:
        return services.ShelterService.create_shelter(db=db, shelter_data=shelter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)