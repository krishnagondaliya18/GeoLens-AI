"""
GeoLens Database Module - MongoDB Atlas Integration
Handles asynchronous persistence for User Profiles, Authentication, and Satellite Analysis History.
Includes graceful fallback if MongoDB connection string is not provided or offline.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger("geolens.database")

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "geolens").strip()

client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None
_is_connected = False
_connection_error = None

# In-memory storage fallback for local development or guest sessions if MongoDB is not configured
_memory_users: Dict[str, Dict[str, Any]] = {}
_memory_analyses: List[Dict[str, Any]] = []

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert MongoDB BSON types (ObjectId, datetime) to standard JSON-compatible types."""
    if not doc:
        return None
    serialized = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            serialized[k] = str(v)
        elif isinstance(v, datetime):
            serialized[k] = v.isoformat()
        elif isinstance(v, dict):
            serialized[k] = serialize_doc(v)
        elif isinstance(v, list):
            serialized[k] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
        else:
            serialized[k] = v
    if "_id" in serialized and "id" not in serialized:
        serialized["id"] = serialized["_id"]
    return serialized

async def init_db() -> bool:
    """Initialize MongoDB Atlas async connection."""
    global client, db, _is_connected, _connection_error
    
    if not MONGODB_URI:
        _is_connected = False
        _connection_error = "MONGODB_URI environment variable not configured"
        logger.info("ℹ️ MongoDB Atlas: URI not set, running in local in-memory fallback mode.")
        return False
        
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            appname="GeoLens-AI"
        )
        db = client[MONGODB_DB_NAME]
        # Ping server to verify connection
        await client.admin.command('ping')
        _is_connected = True
        _connection_error = None
        logger.info("✅ MongoDB Atlas connected successfully to database: %s", MONGODB_DB_NAME)
        
        # Ensure indexes on collections
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.analyses.create_index([("user_id", 1), ("created_at", -1)])
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        _is_connected = False
        _connection_error = str(e)
        logger.warning("⚠️ MongoDB Atlas connection failed (%s). Running in memory fallback mode.", e)
        return False
    except Exception as e:
        _is_connected = False
        _connection_error = str(e)
        logger.warning("⚠️ MongoDB Atlas initialization error: %s", e)
        return False

async def close_db():
    """Close MongoDB connection gracefully."""
    global client, _is_connected
    if client is not None:
        client.close()
        _is_connected = False
        logger.info("MongoDB client closed.")

def get_db_status() -> Dict[str, Any]:
    """Return live database health and connection status."""
    return {
        "connected": _is_connected,
        "database": MONGODB_DB_NAME if _is_connected else None,
        "configured": bool(MONGODB_URI),
        "error": _connection_error,
        "mode": "mongodb_atlas" if _is_connected else ("in_memory_fallback" if not MONGODB_URI else "offline_fallback")
    }

# ----------------- User Queries -----------------

def _cache_user(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc and "id" in doc:
        _memory_users[str(doc["id"])] = doc
    return doc

async def find_user_by_identifier(ident: str) -> Optional[Dict[str, Any]]:
    """Find user by username OR email in a single fast lookup."""
    clean = ident.strip().lower()
    for u in _memory_users.values():
        if u.get("username", "").lower() == clean or u.get("email", "").lower() == clean:
            return u
    if _is_connected and db is not None:
        user = await db.users.find_one({"$or": [{"username": clean}, {"email": clean}]})
        return _cache_user(serialize_doc(user))
    return None

async def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    clean_email = email.strip().lower()
    for u in _memory_users.values():
        if u.get("email") == clean_email:
            return u
    if _is_connected and db is not None:
        user = await db.users.find_one({"email": clean_email})
        return _cache_user(serialize_doc(user))
    return None

async def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    clean_uname = username.strip().lower()
    for u in _memory_users.values():
        if u.get("username", "").lower() == clean_uname:
            return u
    if _is_connected and db is not None:
        user = await db.users.find_one({"username": clean_uname})
        return _cache_user(serialize_doc(user))
    return None

async def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    if str(user_id) in _memory_users:
        return _memory_users[str(user_id)]
    if _is_connected and db is not None:
        try:
            oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else None
            query = {"_id": oid} if oid else {"_id": user_id}
            user = await db.users.find_one(query)
            return _cache_user(serialize_doc(user))
        except Exception as e:
            logger.error("Error finding user by ID: %s", e)
            return None
    return _memory_users.get(str(user_id))

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": user_data["email"].strip().lower(),
        "username": user_data["username"].strip().lower(),
        "password_hash": user_data["password_hash"],
        "full_name": user_data.get("full_name", "").strip(),
        "bio": user_data.get("bio", ""),
        "role": user_data.get("role", "Geospatial Analyst"),
        "created_at": now,
        "updated_at": now,
    }
    
    if _is_connected and db is not None:
        try:
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            return _cache_user(serialize_doc(user_doc))
        except Exception as e:
            logger.warning("MongoDB insert fallback: %s", e)
            existing = await find_user_by_identifier(user_doc["username"]) or await find_user_by_identifier(user_doc["email"])
            if existing:
                return existing
    
    # In-memory fallback
    uid = f"usr_{len(_memory_users) + 1}_{int(now.timestamp())}"
    user_doc["_id"] = uid
    user_doc["id"] = uid
    user_doc["created_at"] = now.isoformat()
    user_doc["updated_at"] = now.isoformat()
    _memory_users[uid] = user_doc
    return user_doc

async def update_user_profile(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    fields = {}
    if "full_name" in update_data and update_data["full_name"] is not None:
        fields["full_name"] = update_data["full_name"].strip()
    if "bio" in update_data and update_data["bio"] is not None:
        fields["bio"] = update_data["bio"].strip()
    if "role" in update_data and update_data["role"] is not None:
        fields["role"] = update_data["role"].strip()
    fields["updated_at"] = now
    
    if str(user_id) in _memory_users:
        _memory_users[str(user_id)].update(fields)
        _memory_users[str(user_id)]["updated_at"] = now.isoformat()

    if _is_connected and db is not None:
        try:
            oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else None
            query = {"_id": oid} if oid else {"_id": user_id}
            await db.users.update_one(query, {"$set": fields})
            updated = await db.users.find_one(query)
            if updated:
                return _cache_user(serialize_doc(updated))
        except Exception as e:
            logger.error("Error updating user profile: %s", e)
            
    return _memory_users.get(str(user_id))

# ----------------- Satellite Analysis History -----------------

async def save_analysis(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save satellite imagery question/answer analysis to MongoDB."""
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": analysis_data.get("user_id"),
        "prompt": analysis_data.get("prompt", ""),
        "mode": analysis_data.get("mode", "vqa"),
        "model": analysis_data.get("model", "gemini-2.5-flash"),
        "response_text": analysis_data.get("response_text", ""),
        "bboxes": analysis_data.get("bboxes", []),
        "latency_sec": analysis_data.get("latency_sec", 0.0),
        "image_meta": analysis_data.get("image_meta", {}),
        "created_at": now
    }
    
    if _is_connected and db is not None:
        res = await db.analyses.insert_one(doc)
        doc["_id"] = res.inserted_id
        return serialize_doc(doc)
        
    # In-memory
    aid = f"anl_{len(_memory_analyses) + 1}_{int(now.timestamp())}"
    doc["_id"] = aid
    doc["id"] = aid
    doc["created_at"] = now.isoformat()
    _memory_analyses.insert(0, doc)
    return doc

async def get_user_analyses(user_id: Optional[str] = None, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
    """Retrieve history of analyses for a specific user (or latest public if user_id is None)."""
    if _is_connected and db is not None:
        query = {"user_id": user_id} if user_id else {}
        cursor = db.analyses.find(query).sort("created_at", -1).skip(skip).limit(limit)
        results = await cursor.to_list(length=limit)
        return [serialize_doc(item) for item in results]
        
    # In-memory
    filtered = [a for a in _memory_analyses if (not user_id or a.get("user_id") == user_id)]
    return filtered[skip:skip + limit]

async def get_analysis_by_id(analysis_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get single analysis by ID."""
    if _is_connected and db is not None:
        try:
            oid = ObjectId(analysis_id) if ObjectId.is_valid(analysis_id) else None
            query: Dict[str, Any] = {"_id": oid} if oid else {"_id": analysis_id}
            if user_id:
                query["user_id"] = user_id
            doc = await db.analyses.find_one(query)
            return serialize_doc(doc)
        except Exception as e:
            logger.error("Error retrieving analysis by ID: %s", e)
            return None
            
    for a in _memory_analyses:
        if a.get("id") == analysis_id or a.get("_id") == analysis_id:
            if not user_id or a.get("user_id") == user_id:
                return a
    return None

async def delete_analysis(analysis_id: str, user_id: Optional[str] = None) -> bool:
    """Delete a single analysis record."""
    if _is_connected and db is not None:
        try:
            oid = ObjectId(analysis_id) if ObjectId.is_valid(analysis_id) else None
            query: Dict[str, Any] = {"_id": oid} if oid else {"_id": analysis_id}
            if user_id:
                query["user_id"] = user_id
            res = await db.analyses.delete_one(query)
            return res.deleted_count > 0
        except Exception as e:
            logger.error("Error deleting analysis: %s", e)
            return False
            
    global _memory_analyses
    initial_len = len(_memory_analyses)
    _memory_analyses = [a for a in _memory_analyses if not (
        (a.get("id") == analysis_id or a.get("_id") == analysis_id) and 
        (not user_id or a.get("user_id") == user_id)
    )]
    return len(_memory_analyses) < initial_len

async def clear_user_history(user_id: str) -> int:
    """Delete all analyses belonging to a specific user."""
    if not user_id:
        return 0
    if _is_connected and db is not None:
        res = await db.analyses.delete_many({"user_id": user_id})
        return res.deleted_count
        
    global _memory_analyses
    initial_len = len(_memory_analyses)
    _memory_analyses = [a for a in _memory_analyses if a.get("user_id") != user_id]
    return initial_len - len(_memory_analyses)
