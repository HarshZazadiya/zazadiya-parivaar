import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship as sa_relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    village_name = Column(String, nullable=True)
    role = Column(String, default="user")  # 'user' or 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    family_trees = sa_relationship("FamilyTree", back_populates="owner", cascade="all, delete-orphan")


class FamilyTree(Base):
    __tablename__ = "family_trees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    family_name = Column(String, nullable=False)
    head_name = Column(String, nullable=False)
    village_name = Column(String, nullable=False)
    status = Column(String, default="pending")  # 'pending', 'approved', 'rejected'
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    owner = sa_relationship("User", back_populates="family_trees")
    members = sa_relationship("FamilyMember", back_populates="family_tree", cascade="all, delete-orphan")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("family_trees.id"), nullable=False)
    parent_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    
    full_name = Column(String, nullable=False, index=True)
    gender = Column(String, nullable=False)  # 'Male', 'Female'
    relationship = Column(String, nullable=False)  # 'Head', 'Parent', 'Spouse', 'Child', 'Sibling'
    date_of_birth = Column(String, nullable=True)
    village_name = Column(String, nullable=False, index=True)
    current_address = Column(Text, nullable=True)
    education = Column(String, nullable=True)
    current_business = Column(String, nullable=True, index=True)
    business_address = Column(Text, nullable=True)
    email_address = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    family_tree = sa_relationship("FamilyTree", back_populates="members")
    parent = sa_relationship("FamilyMember", remote_side=[id], backref="children")


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    district = Column(String, nullable=True)
    state = Column(String, default="Gujarat")
    description = Column(Text, nullable=True)
