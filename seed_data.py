import sys
import os
from database import SessionLocal, Base, engine
import models
from utils.helper import bcrypt_context
from routers.villages import PRESET_VILLAGES

def seed_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed 22 Villages
        for v in PRESET_VILLAGES:
            existing_v = db.query(models.Village).filter(models.Village.name == v["name"]).first()
            if not existing_v:
                village_obj = models.Village(
                    name=v["name"],
                    district=v["district"],
                    state=v["state"],
                    description=v["description"]
                )
                db.add(village_obj)
        db.commit()

        # 2. Seed Default Admin & Regular Users
        admin_email = "admin@zazadiyaparivaar.org"
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_user:
            admin_user = models.User(
                email=admin_email,
                hashed_password=bcrypt_context.hash("admin123"),
                full_name="Zazadiya Parivaar Admin",
                phone_number="+91 9876543210",
                village_name="Savarkundla",
                role="admin",
                is_active=True
            )
            db.add(admin_user)

        user_email = "ramnikbhai@zazadiyaparivaar.org"
        sample_user = db.query(models.User).filter(models.User.email == user_email).first()
        if not sample_user:
            sample_user = models.User(
                email=user_email,
                hashed_password=bcrypt_context.hash("user123"),
                full_name="Ramnikbhai Mansukhbhai Zazadiya",
                phone_number="+91 9925012345",
                village_name="Savarkundla",
                role="user",
                is_active=True
            )
            db.add(sample_user)
        db.commit()
        db.refresh(admin_user)
        db.refresh(sample_user)

        # 3. Seed Sample Family Trees if none exist
        if db.query(models.FamilyTree).count() == 0:
            print("Seeding sample family trees...")
            
            # --- TREE 1: Ramnikbhai Family (Savarkundla & Surat) ---
            tree1 = models.FamilyTree(
                user_id=sample_user.id,
                family_name="Ramnikbhai Mansukhbhai Zazadiya Family",
                head_name="Ramnikbhai Mansukhbhai Zazadiya",
                village_name="Savarkundla",
                status="approved"
            )
            db.add(tree1)
            db.flush()

            # Grandfather / Father Node
            p1 = models.FamilyMember(
                tree_id=tree1.id,
                full_name="Mansukhbhai Gokalbhai Zazadiya",
                gender="Male",
                relationship="Parent",
                date_of_birth="1948-05-12",
                village_name="Savarkundla",
                current_address="Zazadiya Chowk, Main Bazar, Savarkundla, Gujarat",
                education="Primary School",
                current_business="Agriculture & Groundnut Farming",
                business_address="Savarkundla Agricultural Farm, District Amreli",
                email_address="mansukhbhai.zazadiya@gmail.com",
                contact_number="+91 9825101122"
            )
            db.add(p1)
            db.flush()

            # Mother Node
            p2 = models.FamilyMember(
                tree_id=tree1.id,
                full_name="Shantaben Mansukhbhai Zazadiya",
                gender="Female",
                relationship="Parent",
                date_of_birth="1952-08-18",
                village_name="Savarkundla",
                current_address="Zazadiya Chowk, Main Bazar, Savarkundla, Gujarat",
                education="Higher Primary",
                current_business="Homemaker",
                business_address="N/A",
                email_address="",
                contact_number="+91 9825101123"
            )
            db.add(p2)
            db.flush()

            # Head Node (Ramnikbhai)
            head1 = models.FamilyMember(
                tree_id=tree1.id,
                parent_member_id=p1.id,
                full_name="Ramnikbhai Mansukhbhai Zazadiya",
                gender="Male",
                relationship="Head",
                date_of_birth="1974-11-20",
                village_name="Savarkundla",
                current_address="402, Hanumanji Krupa Heights, Varachha Road, Surat, Gujarat",
                education="B.Com (Saurashtra University)",
                current_business="Diamond Trading & Polishing",
                business_address="104, Mini Bazar Diamond Tower, Varachha, Surat",
                email_address="ramnikbhai@zazadiyaparivaar.org",
                contact_number="+91 9925012345"
            )
            db.add(head1)
            db.flush()

            # Spouse Node
            sp1 = models.FamilyMember(
                tree_id=tree1.id,
                full_name="Gitaben Ramnikbhai Zazadiya",
                gender="Female",
                relationship="Spouse",
                date_of_birth="1978-03-15",
                village_name="Savarkundla",
                current_address="402, Hanumanji Krupa Heights, Varachha Road, Surat, Gujarat",
                education="HSC Pass",
                current_business="Boutique & Textile Business",
                business_address="Shop 12, Shree Ram Market, Varachha, Surat",
                email_address="gitaben.z@gmail.com",
                contact_number="+91 9925012346"
            )
            db.add(sp1)
            db.flush()

            # Child 1 (Son)
            c1 = models.FamilyMember(
                tree_id=tree1.id,
                parent_member_id=head1.id,
                full_name="Harsh Ramnikbhai Zazadiya",
                gender="Male",
                relationship="Child",
                date_of_birth="1999-07-24",
                village_name="Savarkundla",
                current_address="402, Hanumanji Krupa Heights, Varachha Road, Surat, Gujarat",
                education="B.Tech Computer Science & Engineering",
                current_business="Software Engineering & IT Solutions",
                business_address="Tech Park, Adajan, Surat, Gujarat",
                email_address="harsh.zazadiya@gmail.com",
                contact_number="+91 9429188776"
            )
            db.add(c1)

            # Child 2 (Daughter)
            c2 = models.FamilyMember(
                tree_id=tree1.id,
                parent_member_id=head1.id,
                full_name="Pooja Ramnikbhai Zazadiya",
                gender="Female",
                relationship="Child",
                date_of_birth="2003-01-10",
                village_name="Savarkundla",
                current_address="402, Hanumanji Krupa Heights, Varachha Road, Surat, Gujarat",
                education="B.B.A Student",
                current_business="Student / Financial Analytics",
                business_address="Surat University Campus",
                email_address="pooja.zazadiya@gmail.com",
                contact_number="+91 9429188777"
            )
            db.add(c2)

            # Sibling of Head
            sib1 = models.FamilyMember(
                tree_id=tree1.id,
                parent_member_id=p1.id,
                full_name="Kishorbhai Mansukhbhai Zazadiya",
                gender="Male",
                relationship="Sibling",
                date_of_birth="1979-09-05",
                village_name="Amreli",
                current_address="B-12, Hanuman Mandir Road, Amreli, Gujarat",
                education="Diploma in Mechanical Engineering",
                current_business="Auto Spare Parts & Hardware Trading",
                business_address="Station Road, Amreli, Gujarat",
                email_address="kishor.zazadiya@gmail.com",
                contact_number="+91 9898011223"
            )
            db.add(sib1)

            # --- TREE 2: Bharatbhai Family (Rajula & Ahmedabad) ---
            tree2 = models.FamilyTree(
                user_id=admin_user.id,
                family_name="Bharatbhai Jadavbhai Zazadiya Family",
                head_name="Bharatbhai Jadavbhai Zazadiya",
                village_name="Rajula",
                status="approved"
            )
            db.add(tree2)
            db.flush()

            head2 = models.FamilyMember(
                tree_id=tree2.id,
                full_name="Bharatbhai Jadavbhai Zazadiya",
                gender="Male",
                relationship="Head",
                date_of_birth="1971-04-14",
                village_name="Rajula",
                current_address="701, Bajrang Complex, Bopal, Ahmedabad, Gujarat",
                education="M.Com, Chartered Accountant",
                current_business="Financial Consultancy & Tax Advisory",
                business_address="302, Corporate House, SG Highway, Ahmedabad",
                email_address="bharat.ca@zazadiyaparivaar.org",
                contact_number="+91 9824055667"
            )
            db.add(head2)
            db.flush()

            sp2 = models.FamilyMember(
                tree_id=tree2.id,
                full_name="Rekhaben Bharatbhai Zazadiya",
                gender="Female",
                relationship="Spouse",
                date_of_birth="1975-09-30",
                village_name="Rajula",
                current_address="701, Bajrang Complex, Bopal, Ahmedabad, Gujarat",
                education="M.A. Gujarati Literature",
                current_business="High School Teacher & Educator",
                business_address="Bopal High School, Ahmedabad",
                email_address="rekha.zazadiya@gmail.com",
                contact_number="+91 9824055668"
            )
            db.add(sp2)

            c3 = models.FamilyMember(
                tree_id=tree2.id,
                parent_member_id=head2.id,
                full_name="Ketan Bharatbhai Zazadiya",
                gender="Male",
                relationship="Child",
                date_of_birth="1998-12-04",
                village_name="Rajula",
                current_address="701, Bajrang Complex, Bopal, Ahmedabad, Gujarat",
                education="M.D. Medicine (BJ Medical College)",
                current_business="Doctor / Physician",
                business_address="Civil Hospital Campus, Ahmedabad",
                email_address="dr.ketan.zazadiya@gmail.com",
                contact_number="+91 9712033445"
            )
            db.add(c3)

            # --- TREE 3: Vrajlal Family (Mahuva) ---
            tree3 = models.FamilyTree(
                user_id=admin_user.id,
                family_name="Vrajlal Savjibhai Zazadiya Family",
                head_name="Vrajlal Savjibhai Zazadiya",
                village_name="Mahuva",
                status="approved"
            )
            db.add(tree3)
            db.flush()

            head3 = models.FamilyMember(
                tree_id=tree3.id,
                full_name="Vrajlal Savjibhai Zazadiya",
                gender="Male",
                relationship="Head",
                date_of_birth="1965-06-25",
                village_name="Mahuva",
                current_address="Zazadiya Vadi, APMC Market Yard Road, Mahuva, Bhavnagar",
                education="Graduate",
                current_business="Onion Dehydration & Agricultural Export",
                business_address="Industrial Estate, Mahuva, Gujarat",
                email_address="vrajlal.agri@gmail.com",
                contact_number="+91 9426211990"
            )
            db.add(head3)

            sp3 = models.FamilyMember(
                tree_id=tree3.id,
                full_name="Savitaben Vrajlal Zazadiya",
                gender="Female",
                relationship="Spouse",
                date_of_birth="1969-10-12",
                village_name="Mahuva",
                current_address="Zazadiya Vadi, APMC Market Yard Road, Mahuva, Bhavnagar",
                education="SSCE",
                current_business="Social Welfare & Homemaker",
                business_address="Mahuva",
                email_address="",
                contact_number="+91 9426211991"
            )
            db.add(sp3)

            c4 = models.FamilyMember(
                tree_id=tree3.id,
                parent_member_id=head3.id,
                full_name="Bhavesh Vrajlal Zazadiya",
                gender="Male",
                relationship="Child",
                date_of_birth="1992-02-18",
                village_name="Mahuva",
                current_address="Zazadiya Vadi, APMC Market Yard Road, Mahuva, Bhavnagar",
                education="B.E. Chemical Engineering",
                current_business="Agro Food Processing Industry",
                business_address="Industrial Estate, Mahuva",
                email_address="bhavesh.zazadiya@gmail.com",
                contact_number="+91 9426211992"
            )
            db.add(c4)

            db.commit()
            print("Sample data successfully seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
