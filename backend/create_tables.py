"""
Script to create database tables using SQLAlchemy models.
Use this if migrations were stamped but tables don't actually exist.
"""
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from sqlalchemy import create_engine, inspect
from app.database import Base, engine
# Import all models so SQLAlchemy knows about them
from app.models import User, Shelter, Pet, UserFavorite

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

print("Connecting to database...")
print(f"Database URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'hidden'}")

# Check existing tables
inspector = inspect(engine)
existing_tables = inspector.get_table_names()
print(f"\nExisting tables: {existing_tables}")

# Create all tables
print("\nCreating tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created successfully!")
    
    # Verify tables were created
    inspector = inspect(engine)
    new_tables = inspector.get_table_names()
    print(f"\nTables in database: {new_tables}")
    
    if 'users' in new_tables and 'shelters' in new_tables and 'pets' in new_tables:
        print("\n[OK] All required tables exist!")
    else:
        print("\n[WARNING] Some tables may be missing")
        
except Exception as e:
    print(f"\n[ERROR] Error creating tables: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nDone! You can now run import_data.py to import your data.")

