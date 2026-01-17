import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

tables = ['users', 'shelters', 'pets', 'user_favorites']

backup_data = {}

with engine.connect() as conn:
    for table in tables:
        try:
            result = conn.execute(text(f"SELECT * FROM {table}"))
            rows = []
            for row in result:
                row_dict = {}
                for key, value in row._mapping.items():
                    if isinstance(value, datetime):
                        row_dict[key] = value.isoformat()
                    else:
                        row_dict[key] = value
                rows.append(row_dict)
            backup_data[table] = rows
            print(f"Exported {len(rows)} rows from {table}")
        except Exception as e:
            print(f"Warning: Could not export {table}: {e}")

with open('backup_data.json', 'w', encoding='utf-8') as f:
    json.dump(backup_data, f, indent=2, default=str)

print(f"\nBackup saved to backup_data.json")
print(f"Total tables backed up: {len(backup_data)}")

