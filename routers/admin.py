import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import FamilyTree, FamilyMember, User, Village
from schemas import FamilyTreeResponse, FamilyTreeStatusUpdate, DashboardStats, UserResponse
from utils.dependencies import db_dependency, admin_dependency

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)

ADMIN_DELETE_KEY = os.getenv("ADMIN_DELETE_KEY", "ZAZADIYA_DELETE_2026")


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin: admin_dependency, db: db_dependency):
    """
    Get aggregated statistics for admin dashboard.
    """
    total_families = db.query(FamilyTree).filter(FamilyTree.status == "approved").count()
    total_members = db.query(FamilyMember).join(FamilyTree).filter(FamilyTree.status == "approved").count()
    # Count admin-managed villages (dynamic — no hardcoded fallback)
    total_villages = db.query(func.count(Village.id)).scalar() or 0
    pending_approvals = db.query(FamilyTree).filter(FamilyTree.status == "pending").count()

    return DashboardStats(
        total_families=total_families,
        total_members=total_members,
        total_villages=total_villages,
        pending_approvals=pending_approvals
    )


@router.get("/pending-trees", response_model=List[FamilyTreeResponse])
async def get_pending_trees(admin: admin_dependency, db: db_dependency):
    """
    List all pending family tree submissions awaiting admin review.
    """
    pending_trees = db.query(FamilyTree).filter(FamilyTree.status == "pending").order_by(FamilyTree.created_at.asc()).all()
    return pending_trees


@router.put("/trees/{tree_id}/status", response_model=FamilyTreeResponse)
async def update_tree_status(
    tree_id: int,
    status_update: FamilyTreeStatusUpdate,
    admin: admin_dependency,
    db: db_dependency
):
    """
    Approve or reject a submitted family tree.
    """
    if status_update.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status option")

    tree = db.query(FamilyTree).filter(FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family tree not found")

    tree.status = status_update.status
    if status_update.admin_notes is not None:
        tree.admin_notes = status_update.admin_notes

    db.commit()
    db.refresh(tree)
    return tree


@router.delete("/trees/{tree_id}")
async def delete_family_tree(
    tree_id: int,
    admin: admin_dependency,
    db: db_dependency,
    security_key: str = Query(..., description="Special Admin Security Key required to delete entries")
):
    """
    Delete a family tree entry. Requires Special Admin Security Key.
    """
    if security_key.strip() != ADMIN_DELETE_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Special Admin Security Key. Deletion denied."
        )

    tree = db.query(FamilyTree).filter(FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family tree not found")

    db.delete(tree)
    db.commit()
    return {"message": f"Family tree '{tree.family_name}' deleted successfully by admin."}


@router.get("/users", response_model=List[UserResponse])
async def list_users(admin: admin_dependency, db: db_dependency):
    """
    List all registered users.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users