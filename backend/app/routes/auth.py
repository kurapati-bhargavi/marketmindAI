from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.auth.roles import UserRole, ROLE_PERMISSIONS
from app.schemas.user import RegisterRequest, LoginRequest, UserResponse

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get the authenticated user profile and active permissions.
    """
    return current_user


@router.get("/roles")
def get_system_roles():
    """
    Get all available platform roles and their assigned permission scopes.
    """
    return {
        "roles": [
            {
                "name": role.value,
                "permissions": ROLE_PERMISSIONS.get(role, [])
            }
            for role in UserRole
        ]
    }


@router.post("/register")
def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account with role selection.
    """
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email is already registered."
        )

    role_val = user_data.role.value if hasattr(user_data.role, "value") else str(user_data.role)

    new_user = User(
        name=user_data.name.strip(),
        email=user_data.email.strip().lower(),
        password_hash=hash_password(user_data.password),
        role=role_val,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically generate access token upon registration
    access_token = create_access_token(
        data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "role": new_user.role,
            "name": new_user.name
        }
    )

    return {
        "success": True,
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }


@router.post("/login")
def login(
    user_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT access token.
    """
    user = db.query(User).filter(
        User.email == user_data.email.strip().lower()
    ).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.name
        }
    )

    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@router.post("/seed-demo-users")
def seed_demo_users(db: Session = Depends(get_db)):
    """
    Seeds demo user accounts for each of the 4 roles for instant testing and evaluation.
    """
    demo_accounts = [
        ("Owner Demo", "owner@marketmind.ai", "Owner@123", UserRole.BUSINESS_OWNER.value),
        ("Store Manager Demo", "manager@marketmind.ai", "Manager@123", UserRole.STORE_MANAGER.value),
        ("Sales Exec Demo", "sales@marketmind.ai", "Sales@123", UserRole.SALES_EXECUTIVE.value),
        ("Admin Demo", "admin@marketmind.ai", "Admin@123", UserRole.SYSTEM_ADMINISTRATOR.value),
    ]

    created = 0
    for name, email, pwd, role in demo_accounts:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=hash_password(pwd),
                role=role,
                is_active=True
            )
            db.add(user)
            created += 1

    db.commit()
    return {
        "success": True,
        "message": f"Seeded {created} demo user accounts.",
        "accounts": [
            {"email": email, "password": pwd, "role": role}
            for _, email, pwd, role in demo_accounts
        ]
    }