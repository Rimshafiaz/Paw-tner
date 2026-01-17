import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

if not os.path.exists('backup_data.json'):
    print("ERROR: backup_data.json not found")
    sys.exit(1)

print(f"Loading backup data...")
with open('backup_data.json', 'r', encoding='utf-8') as f:
    backup_data = json.load(f)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

# Define boolean columns for each table
BOOLEAN_COLUMNS = {
    'users': ['has_children', 'has_yard', 'has_other_pets', 'basic_preferences_complete', 
              'extended_preferences_complete', 'is_active'],
    'shelters': ['is_verified', 'is_active'],
    'pets': ['is_spayed_neutered', 'good_with_kids', 'good_with_dogs', 'good_with_cats', 
             'good_with_other_animals', 'house_trained'],
    'user_favorites': []
}

def convert_boolean_values(row_data, table_name):
    """Convert integer 0/1 to boolean False/True for boolean columns"""
    if table_name in BOOLEAN_COLUMNS:
        for col in BOOLEAN_COLUMNS[table_name]:
            if col in row_data and row_data[col] is not None:
                # Convert 0/1 to False/True
                if isinstance(row_data[col], int):
                    row_data[col] = bool(row_data[col])
    return row_data

# Process each table in its own transaction
for table_name, rows in backup_data.items():
    if not rows:
        print(f"Skipping {table_name} (empty)")
        continue
        
    print(f"\nImporting {len(rows)} rows into {table_name}...")
    
    try:
        with engine.begin() as conn:
            inspector = inspect(engine)
            # Check if table exists
            if table_name not in inspector.get_table_names():
                print(f"[ERROR] Table {table_name} does not exist. Skipping.")
                continue
                
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            
            for row in rows:
                row_data = {k: v for k, v in row.items() if k in columns}
                if not row_data:
                    continue
                
                # Convert boolean values
                row_data = convert_boolean_values(row_data, table_name)
                    
                cols = ', '.join(row_data.keys())
                placeholders = ', '.join([f':{k}' for k in row_data.keys()])
                
                insert_sql = f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})"
                conn.execute(text(insert_sql), row_data)
            
            print(f"[OK] Successfully imported {len(rows)} rows into {table_name}")
    except Exception as e:
        print(f"[ERROR] Error importing {table_name}: {e}")
        import traceback
        traceback.print_exc()

print("\nImport complete!")

