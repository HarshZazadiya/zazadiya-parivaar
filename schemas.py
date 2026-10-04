from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr
from datetime import datetime

# =========================================================
# AUTH & USER SCHEMAS
# =========================================================
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    phone_number: Optional[str] = None
    village_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    full_name: str
    email: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    village_name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# =========================================================
# FAMILY MEMBER SCHEMAS
# =========================================================
class FamilyMemberCreate(BaseModel):
    id: Optional[int] = None
    parent_member_id: Optional[int] = None
    spouse_of_id: Optional[int] = None
    full_name: str
    gender: str
    relationship: str
    date_of_birth: Optional[str] = None
    village_name: str
    current_address: Optional[str] = None
    education: Optional[str] = None
    current_business: Optional[str] = None
    business_address: Optional[str] = None
    email_address: Optional[str] = None
    contact_number: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class FamilyMemberResponse(BaseModel):
    id: int
    tree_id: int
    parent_member_id: Optional[int] = None
    spouse_of_id: Optional[int] = None
    full_name: str
    gender: str
    relationship: str
    date_of_birth: Optional[str] = None
    village_name: str
    current_address: Optional[str] = None
    education: Optional[str] = None
    current_business: Optional[str] = None
    business_address: Optional[str] = None
    email_address: Optional[str] = None
    contact_number: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# =========================================================
# FAMILY TREE SCHEMAS
# =========================================================
class FamilyTreeCreate(BaseModel):
    family_name: str
    head_name: str
    village_name: str
    members: List[FamilyMemberCreate]
    # NEW: node positions, keyed by member id (as strings)
    positions: Optional[Dict[str, Dict[str, float]]] = None

class FamilyTreeStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class FamilyTreeResponse(BaseModel):
    id: int
    user_id: int
    family_name: str
    head_name: str
    village_name: str
    status: str
    admin_notes: Optional[str] = None
    positions: Optional[Dict[str, Dict[str, float]]] = None
    created_at: datetime
    updated_at: datetime
    members: List[FamilyMemberResponse] = []

    class Config:
        from_attributes = True

# =========================================================
# VILLAGE & STATS SCHEMAS
# =========================================================
class VillageResponse(BaseModel):
    id: int
    name: str
    district: Optional[str] = None
    state: str = "Gujarat"
    member_count: int = 0
    tree_count: int = 0

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_families: int
    total_members: int
    total_villages: int
    pending_approvals: int