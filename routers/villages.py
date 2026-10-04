from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Village, FamilyMember, FamilyTree
from schemas import VillageResponse
from utils.dependencies import db_dependency

router = APIRouter(
    prefix="/villages",
    tags=["Villages"]
)

# Preset 22 Villages list of Zazadiya Parivaar
PRESET_VILLAGES = [
    {"name": "Savarkundla", "district": "Amreli", "state": "Gujarat", "description": "Ancestral root village of Zazadiya Parivaar"},
    {"name": "Amreli", "district": "Amreli", "state": "Gujarat", "description": "Major district center of Zazadiya family members"},
    {"name": "Rajula", "district": "Amreli", "state": "Gujarat", "description": "Coastal region family hub"},
    {"name": "Mahuva", "district": "Bhavnagar", "state": "Gujarat", "description": "Prominent business & agricultural community hub"},
    {"name": "Bhavnagar", "district": "Bhavnagar", "state": "Gujarat", "description": "Urban trade center"},
    {"name": "Junagadh", "district": "Junagadh", "state": "Gujarat", "description": "Gir region family settlement"},
    {"name": "Surat", "district": "Surat", "state": "Gujarat", "description": "Diamond & Textile hub for Zazadiya family entrepreneurs"},
    {"name": "Ahmedabad", "district": "Ahmedabad", "state": "Gujarat", "description": "Capital business & corporate hub"},
    {"name": "Jamnagar", "district": "Jamnagar", "state": "Gujarat", "description": "Saurashtra coastal family center"},
    {"name": "Jetpur", "district": "Rajkot", "state": "Gujarat", "description": "Dyeing & printing industry business hub"},
    {"name": "Dhari", "district": "Amreli", "state": "Gujarat", "description": "Gir forest border region family village"},
    {"name": "Khambha", "district": "Amreli", "state": "Gujarat", "description": "Amreli district agriculture village"},
    {"name": "Una", "district": "Gir Somnath", "state": "Gujarat", "description": "Coastal & trade community center"},
    {"name": "Lathi", "district": "Amreli", "state": "Gujarat", "description": "Historic Saurashtra town settlement"},
    {"name": "Chalala", "district": "Amreli", "state": "Gujarat", "description": "Agriculture & trade center"},
    {"name": "Gariadhar", "district": "Bhavnagar", "state": "Gujarat", "description": "Bhavnagar region family hub"},
    {"name": "Botad", "district": "Botad", "state": "Gujarat", "description": "Cotton & diamond business hub"},
    {"name": "Gondal", "district": "Rajkot", "state": "Gujarat", "description": "Heritage town family community"},
    {"name": "Rajkot", "district": "Rajkot", "state": "Gujarat", "description": "Central Saurashtra commercial & education hub"},
    {"name": "Vadodara", "district": "Vadodara", "state": "Gujarat", "description": "Cultural & industrial city hub"},
    {"name": "Mumbai", "district": "Mumbai", "state": "Maharashtra", "description": "Metropolitan business & trade hub for family members"},
    {"name": "Liliya", "district": "Amreli", "state": "Gujarat", "description": "Amreli district traditional family village"}
]


@router.get("", response_model=List[VillageResponse])
async def list_villages(db: db_dependency):
    """
    Get list of all 22 Villages with member and family tree count statistics.
    """
    db_villages = db.query(Village).all()
    
    # If DB villages empty, return presets with computed live stats
    village_list = []
    
    # Fetch live counts per village from database for approved trees
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

    if db_villages:
        for v in db_villages:
            v_key = v.name.strip().lower()
            village_list.append(
                VillageResponse(
                    id=v.id,
                    name=v.name,
                    district=v.district,
                    state=v.state or "Gujarat",
                    description=v.description,
                    member_count=counts_map.get(v_key, 0),
                    tree_count=tree_map.get(v_key, 0)
                )
            )
    else:
        for idx, pv in enumerate(PRESET_VILLAGES, 1):
            v_key = pv["name"].strip().lower()
            village_list.append(
                VillageResponse(
                    id=idx,
                    name=pv["name"],
                    district=pv["district"],
                    state=pv["state"],
                    description=pv["description"],
                    member_count=counts_map.get(v_key, 0),
                    tree_count=tree_map.get(v_key, 0)
                )
            )

    return village_list
