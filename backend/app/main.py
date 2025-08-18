from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import get_db, engine
from sqlalchemy import text


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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)