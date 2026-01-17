import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import cloudinary
import cloudinary.uploader

sys.path.insert(0, str(Path(__file__).parent))

from app.models import Pet
from app.database import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    print("ERROR: Cloudinary credentials not found in environment")
    print("Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET")
    sys.exit(1)

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate_photos():
    db = SessionLocal()
    try:
        pets = db.query(Pet).filter(Pet.primary_photo_url.isnot(None)).all()
        print(f"Found {len(pets)} pets with photos")
        
        migrated = 0
        skipped = 0
        failed = 0
        
        for pet in pets:
            photo_url = pet.primary_photo_url
            
            if not photo_url:
                continue
                
            if 'cloudinary.com' in photo_url:
                print(f"Pet {pet.id} ({pet.name}): Already on Cloudinary, skipping")
                skipped += 1
                continue
            
            if not photo_url.startswith('/uploads/'):
                print(f"Pet {pet.id} ({pet.name}): Unknown URL format: {photo_url}, skipping")
                skipped += 1
                continue
            
            file_path = Path("uploads") / photo_url[9:]
            
            if not file_path.exists():
                print(f"Pet {pet.id} ({pet.name}): File not found: {file_path}, skipping")
                skipped += 1
                continue
            
            try:
                print(f"Migrating Pet {pet.id} ({pet.name}): {file_path}")
                
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                
                file_extension = file_path.suffix[1:].lower()
                unique_filename = f"pets/{pet.id}_{pet.name.replace(' ', '_')}.{file_extension}"
                
                upload_result = cloudinary.uploader.upload(
                    file_content,
                    folder="paw-tner/pets",
                    public_id=unique_filename,
                    resource_type="image"
                )
                
                new_url = upload_result.get("secure_url") or upload_result.get("url")
                pet.primary_photo_url = new_url
                db.commit()
                
                print(f"  ✓ Migrated to: {new_url}")
                migrated += 1
                
            except Exception as e:
                print(f"  ✗ Failed: {e}")
                db.rollback()
                failed += 1
        
        print(f"\nMigration complete!")
        print(f"  Migrated: {migrated}")
        print(f"  Skipped: {skipped}")
        print(f"  Failed: {failed}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_photos()

