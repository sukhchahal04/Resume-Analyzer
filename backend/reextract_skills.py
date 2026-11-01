import json
from db.database import SessionLocal
from db.models import Resume
from services.parsing import extract_skills

db = SessionLocal()
for r in db.query(Resume).all():
    r.skills_json = json.dumps(extract_skills(r.raw_text))
db.commit()
db.close()
print("done")