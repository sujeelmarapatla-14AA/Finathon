"""
SpendIntel - Enterprise Authentication Route.

Endpoints:
- POST /api/auth/signup
- POST /api/auth/login
- GET  /api/auth/me
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status

try:
    from app.models.auth import SignupRequest, LoginRequest, LoginResponse, SignupResponse, UserResponse
    from app.services.auth import (
        is_email_authorized,
        get_user_by_email,
        get_user_by_id,
        create_user,
        verify_password,
        create_access_token,
        decode_access_token,
        update_last_login,
    )
except ImportError:
    from backend.app.models.auth import SignupRequest, LoginRequest, LoginResponse, SignupResponse, UserResponse
    from backend.app.services.auth import (
        is_email_authorized,
        get_user_by_email,
        get_user_by_id,
        create_user,
        verify_password,
        create_access_token,
        decode_access_token,
        update_last_login,
    )

router = APIRouter(tags=["auth"])


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency to extract and validate the JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(user_id)
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/auth/signup", response_model=SignupResponse)
@router.post("/signup", response_model=SignupResponse)
@router.post("/auth/register", response_model=SignupResponse)
@router.post("/register", response_model=SignupResponse)
def signup(req: SignupRequest) -> SignupResponse:
    """
    Register a new corporate account with an authorized company email.
    """
    clean_email = req.email.strip().lower()
    clean_name = req.name.strip()

    # 1. Enforce corporate email domain / allowlist
    if not is_email_authorized(clean_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not authorized for SpendIntel access.",
        )

    # 2. Check for duplicate account
    existing = get_user_by_email(clean_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 3. Create user (default role: procurement_analyst)
    create_user(name=clean_name, email=clean_email, password=req.password, role="procurement_analyst")

    return SignupResponse(
        success=True,
        message="Account created successfully",
    )


@router.post("/auth/login", response_model=LoginResponse)
@router.post("/login", response_model=LoginResponse)
@router.post("/auth/signin", response_model=LoginResponse)
@router.post("/signin", response_model=LoginResponse)
def login(req: LoginRequest) -> LoginResponse:
    """
    Authenticate user via email and password, returning JWT access token.
    """
    clean_email = req.email.strip().lower()

    # 1. Query user from DB
    user = get_user_by_email(clean_email)

    if user:
        # Check active status
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is deactivated. Please contact your procurement administrator.",
            )

        # Verify password hash
        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect.",
            )

        # Update last login & create access token
        update_last_login(user["id"])
        token = create_access_token(
            user_id=user["id"],
            email=user["email"],
            role=user["role"],
            name=user["full_name"],
        )

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse(
                id=user["id"],
                name=user["full_name"],
                email=user["email"],
                role=user["role"],
                is_active=bool(user["is_active"]),
            ),
        )

    # If user not found in DB, check if email is even authorized
    if not is_email_authorized(clean_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not authorized for SpendIntel access.",
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email or password is incorrect.",
    )


@router.get("/auth/me", response_model=UserResponse)
@router.get("/me", response_model=UserResponse)
@router.get("/auth/user", response_model=UserResponse)
@router.get("/user", response_model=UserResponse)
def get_me(user: Dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    """
    Retrieve current authenticated user profile.
    """
    return UserResponse(
        id=user["id"],
        name=user["full_name"],
        email=user["email"],
        role=user["role"],
        is_active=bool(user["is_active"]),
    )


