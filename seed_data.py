import sys
import os
from database import SessionLocal, Base, engine
import models
from utils.helper import bcrypt_context
from routers.villages import DEFAULT_VILLAGES

def seed_database():
    print("Initializing database tables and seed data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Initial Admin-Managed Villages
        for v in DEFAULT_VILLAGES:
            existing_v = db.query(models.Village).filter(models.Village.name == v["name"]).first()
            if not existing_v:
                village_obj = models.Village(
                    name=v["name"],
                    district=v["district"],
                    state=v["state"]
                )
                db.add(village_obj)
        db.commit()

        # 2. Seed Admin Credentials (admin@zazadiyaparivaar.org / Admin@123)
        admin_email = os.getenv("ADMIN_EMAIL", "admin@zazadiyaparivaar.org").lower()
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")

        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_user:
            admin_user = models.User(
                email=admin_email,
                hashed_password=bcrypt_context.hash(admin_password),
                full_name="Zazadiya Parivaar Admin",
                phone_number="+91 9876543210",
                village_name="Savarkundla",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"Admin account created: Email={admin_email} | Password={admin_password}")
        else:
            print(f"Admin account verified: {admin_email}")

        print("Database seeding completed cleanly without mock trees.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
