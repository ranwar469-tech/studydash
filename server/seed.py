from database import init_db, SessionLocal
from models import StudySet

init_db()
db = SessionLocal()

if db.query(StudySet).count() == 0:
    sets = [
        StudySet(title="Data Structures & Algorithms", subject="Computer Science"),
        StudySet(title="Linear Algebra", subject="Mathematics"),
        StudySet(title="Machine Learning Basics", subject="Computer Science"),
        StudySet(title="Organic Chemistry", subject="Chemistry"),
        StudySet(title="Async JavaScript Pitfalls", subject="Computer Science"),
    ]
    for s in sets:
        db.add(s)
    db.commit()
    print(f"Seeded {len(sets)} study sets")
else:
    print("Study sets already exist, skipping seed")

db.close()
