"""
SpendIntel - Authentication Pydantic Data Models & Schemas.
"""

import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: str = Field(..., description="Approved corporate email address")
    password: str = Field(..., min_length=8, max_length=128, description="Secure password")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Enter a valid email address.")
        return clean


class LoginRequest(BaseModel):
    email: str = Field(..., description="Corporate email address")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Enter a valid email address.")
        return clean


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SignupResponse(BaseModel):
    success: bool = True
    message: str = "Account created successfully"
