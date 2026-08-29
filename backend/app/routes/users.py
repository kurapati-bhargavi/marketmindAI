from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.auth.dependencies import require_role
from app.auth.security import hash_password
from app.schemas.user import UserResponse, UserUpdate, RegisterRequest

router = APIRouter(
    prefix="/users",
    tags=["User Management"]
)


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("System Administrator", "Business Owner"))
):
    """
    List all platform users with roles, activation status and creation timestamps.
    """
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/", response_model=UserResponse)
def create_user_by_admin(
    user_data: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("System Administrator"))
):
    """
    Administrator creates a new user with specific role.
    """
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role.value if hasattr(user_data.role, "value") else str(user_data.role),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("System Administrator"))
):
    """
    Administrator updates user role, active status, or name.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if update_data.name is not None:
        user.name = update_data.name
    if update_data.role is not None:
        user.role = update_data.role.value if hasattr(update_data.role, "value") else str(update_data.role)
    if update_data.is_active is not None:
        user.is_active = update_data.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("System Administrator"))
):
    """
    Administrator deletes a user account.
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own administrative account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user.email} was removed."}
