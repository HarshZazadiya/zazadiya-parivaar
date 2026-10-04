from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from database import get_db
from models import FamilyTree, FamilyMember, User
from schemas import FamilyTreeCreate, FamilyTreeResponse, FamilyMemberResponse
from utils.dependencies import db_dependency, user_dependency, get_optional_current_user

router = APIRouter(
    prefix="/family",
    tags=["Family Trees & Members"]
)


@router.post("/trees", response_model=FamilyTreeResponse, status_code=status.HTTP_201_CREATED)
async def create_family_tree(
    tree_data: FamilyTreeCreate,
    current_user: user_dependency,
    db: db_dependency
):
    """
    Create and submit a new family tree with head and family members.
    Status defaults to 'pending' for admin review.
    """
    # Create the family tree record
    new_tree = FamilyTree(
        user_id=current_user.id,
        family_name=tree_data.family_name.strip(),
        head_name=tree_data.head_name.strip(),
        village_name=tree_data.village_name.strip(),
        status="pending"
    )
    db.add(new_tree)
    db.flush()  # to get new_tree.id

    # Mapping of temporary frontend ID to created DB ID for parent-child relationship linking
    id_map = {}

    # First pass: Create member entities
    created_members = []
    for member_input in tree_data.members:
        member = FamilyMember(
            tree_id=new_tree.id,
            full_name=member_input.full_name.strip(),
            gender=member_input.gender,
            relationship=member_input.relationship,
            date_of_birth=member_input.date_of_birth,
            village_name=member_input.village_name.strip(),
            current_address=member_input.current_address,
            education=member_input.education,
            current_business=member_input.current_business,
            business_address=member_input.business_address,
            email_address=member_input.email_address,
            contact_number=member_input.contact_number,
            notes=member_input.notes
        )
        db.add(member)
        db.flush()

        if member_input.id:
            id_map[member_input.id] = member.id
        
        created_members.append((member, member_input))

    # Second pass: Link parent_member_id if provided
    for member, member_input in created_members:
        if member_input.parent_member_id and member_input.parent_member_id in id_map:
            member.parent_member_id = id_map[member_input.parent_member_id]

    db.commit()
    db.refresh(new_tree)
    return new_tree


@router.get("/trees", response_model=List[FamilyTreeResponse])
async def list_family_trees(
    db: db_dependency,
    village_name: Optional[str] = Query(None, description="Filter by village"),
    search: Optional[str] = Query(None, description="Search by family head name or family title"),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    List family trees. Visitors/Users see approved trees.
    Admins see all trees.
    """
    query = db.query(FamilyTree)

    # Show only approved trees for general users, unless user is admin
    if not current_user or current_user.role != "admin":
        query = query.filter(FamilyTree.status == "approved")

    if village_name:
        query = query.filter(func.lower(FamilyTree.village_name) == village_name.strip().lower())

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(FamilyTree.family_name).like(search_pattern),
                func.lower(FamilyTree.head_name).like(search_pattern)
            )
        )

    trees = query.order_by(FamilyTree.created_at.desc()).all()
    return trees


@router.get("/my-trees", response_model=List[FamilyTreeResponse])
async def list_user_trees(
    current_user: user_dependency,
    db: db_dependency
):
    """
    Get all family trees created by the logged-in user.
    """
    trees = db.query(FamilyTree).filter(FamilyTree.user_id == current_user.id).order_by(FamilyTree.created_at.desc()).all()
    return trees


@router.get("/trees/{tree_id}", response_model=FamilyTreeResponse)
async def get_family_tree(
    tree_id: int,
    db: db_dependency,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get family tree by ID with full member node list.
    """
    tree = db.query(FamilyTree).filter(FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family tree not found")

    # If pending/rejected, only owner or admin can view
    if tree.status != "approved":
        if not current_user or (current_user.id != tree.user_id and current_user.role != "admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This family tree is under admin review.")

    return tree


@router.get("/members/search", response_model=List[FamilyMemberResponse])
async def search_family_members(
    db: db_dependency,
    q: Optional[str] = Query(None, description="Search name, occupation, address, or phone"),
    village_name: Optional[str] = Query(None, description="Filter by Village"),
    business: Optional[str] = Query(None, description="Filter by Business/Occupation"),
    education: Optional[str] = Query(None, description="Filter by Education"),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Search and filter family members across all approved family trees.
    """
    # Join with FamilyTree to ensure we only search approved family trees
    query = db.query(FamilyMember).join(FamilyTree).filter(FamilyTree.status == "approved")

    if village_name and village_name.strip():
        query = query.filter(func.lower(FamilyMember.village_name) == village_name.strip().lower())

    if business and business.strip():
        query = query.filter(func.lower(FamilyMember.current_business).like(f"%{business.strip().lower()}%"))

    if education and education.strip():
        query = query.filter(func.lower(FamilyMember.education).like(f"%{education.strip().lower()}%"))

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(FamilyMember.full_name).like(term),
                func.lower(FamilyMember.current_business).like(term),
                func.lower(FamilyMember.village_name).like(term),
                func.lower(FamilyMember.education).like(term),
                func.lower(FamilyMember.current_address).like(term),
                func.lower(FamilyMember.contact_number).like(term)
            )
        )

    members = query.limit(limit).all()
    return members
