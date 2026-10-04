from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Village, FamilyMember, FamilyTree
from schemas import VillageResponse
from utils.dependencies import db_dependency, admin_dependency
from pydantic import BaseModel

router = APIRouter(
    prefix="/villages",
    tags=["Villages"]
)

class VillageCreate(BaseModel):
    name: str
    district: Optional[str] = None
    state: str = "Gujarat"

# Initial default villages to seed database if empty
DEFAULT_VILLAGES = [
]


@router.get("", response_model=List[VillageResponse])
async def list_villages(db: db_dependency):
    """
    Get list of all admin-managed villages with member and family tree count statistics.
    """
    db_villages = db.query(Village).order_by(Village.name.asc()).all()

    # If DB has no villages yet, seed initial default villages
    if not db_villages:
        for dv in DEFAULT_VILLAGES:
            v_obj = Village(
                name=dv["name"],
                district=dv["district"],
                state=dv["state"]
            )
            db.add(v_obj)
        db.commit()
        db_villages = db.query(Village).order_by(Village.name.asc()).all()

    # Compute live stats
    counts_by_village = db.query(
        FamilyMember.village_name,
        func.count(FamilyMember.id)
    ).join(FamilyTree).filter(FamilyTree.status == "approved").group_by(FamilyMember.village_name).all()
    counts_map = {v.strip().lower(): count for v, count in counts_by_village if v}

    tree_counts_by_village = db.query(
        FamilyTree.village_name,
        func.count(FamilyTree.id)
    ).filter(FamilyTree.status == "approved").group_by(FamilyTree.village_name).all()
    tree_map = {v.strip().lower(): count for v, count in tree_counts_by_village if v}

    village_list = []
    for v in db_villages:
        v_key = v.name.strip().lower()
        village_list.append(
            VillageResponse(
                id=v.id,
                name=v.name,
                district=v.district,
                state=v.state or "Gujarat",
                member_count=counts_map.get(v_key, 0),
                tree_count=tree_map.get(v_key, 0)
            )
        )

    return village_list


@router.post("", response_model=VillageResponse, status_code=status.HTTP_201_CREATED)
async def create_village(
    village_data: VillageCreate,
    admin: admin_dependency,
    db: db_dependency
):
    """
    Admin Endpoint: Add a new village to the official dropdown list.
    """
    existing = db.query(Village).filter(func.lower(Village.name) == village_data.name.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Village '{village_data.name}' already exists in the system."
        )

    new_village = Village(
        name=village_data.name.strip(),
        district=village_data.district.strip() if village_data.district else None,
        state=village_data.state or "Gujarat"
    )
    db.add(new_village)
    db.commit()
    db.refresh(new_village)

    return VillageResponse(
        id=new_village.id,
        name=new_village.name,
        district=new_village.district,
        state=new_village.state,
        member_count=0,
        tree_count=0
    )


@router.delete("/{village_id}")
async def delete_village(
    village_id: int,
    admin: admin_dependency,
    db: db_dependency
):
    """
    Admin Endpoint: Remove a village from the official list.
    """
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Village not found")

    db.delete(village)
    db.commit()
    return {"message": f"Village '{village.name}' deleted successfully."}
