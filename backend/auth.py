"""
GeoLens Authentication Module
Handles password hashing (bcrypt), JWT generation/verification (PyJWT),
and FastAPI dependencies for user registration, login, and profile protection.
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
import logging

logger = logging.getLogger("geolens.auth")

JWT_SECRET = os.getenv("JWT_SECRET", "geolens-satellite-intelligence-secure-jwt-secret-key-2026-production-ready")
if len(JWT_SECRET) < 32:
    JWT_SECRET = JWT_SECRET.ljust(32, "x")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "72"))

def hash_password(password: str) -> str:
    """Hash a plaintext password with fast bcrypt salt for low-latency cloud auth."""
    salt = bcrypt.gensalt(rounds=4)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.warning("Password verification failure: %s", e)
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.debug("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.debug("Invalid JWT token: %s", e)
        return None

def extract_token_from_header(auth_header: Optional[str]) -> Optional[str]:
    """Extract bearer token from Authorization header."""
    if not auth_header:
        return None
    parts = auth_header.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None

async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """
    Extract user from Bearer token if provided.
    Returns user dict or None if guest/unauthenticated (never raises 401).
    """
    from database import find_user_by_id
    auth_header = request.headers.get("Authorization")
    token = extract_token_from_header(auth_header)
    if not token:
        # Check query param token for SSE / EventSource support
        token = request.query_params.get("token")
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    user = await find_user_by_id(user_id)
    if user:
        # Do not expose password hash
        user.pop("password_hash", None)
    return user

async def get_current_user_required(request: Request) -> Dict[str, Any]:
    """
    Extract user from Bearer token.
    Raises HTTP 401 Unauthorized if missing or invalid.
    """
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in or register.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
