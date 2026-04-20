from fastapi import APIRouter, HTTPException
import hashlib

from app.models import UserCredentials, PrivateKeyResponse
from app.database import users_db
from app.crypto_engine import (
    hash_identity_to_group, 
    generate_private_key, 
    get_master_public_key, 
    P, G
)

router = APIRouter()

@router.post("/register", status_code=201)
def register_vehicle(creds: UserCredentials):
    vid = creds.vehicle_id.upper()
    if vid in users_db:
        raise HTTPException(status_code=400, detail="Vehicle already exists")
    
    pwd_hash = hashlib.sha256(creds.password.encode('utf-8')).hexdigest()
    users_db[vid] = pwd_hash
    
    return {"message": "Vehicle registered successfully"}

@router.post("/login", response_model=PrivateKeyResponse)
def login_and_extract_key(creds: UserCredentials):
    vid = creds.vehicle_id.upper()
    
    if vid not in users_db:
        raise HTTPException(status_code=400, detail="User not found")
    
    pwd_hash = hashlib.sha256(creds.password.encode('utf-8')).hexdigest()
    if users_db[vid] != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Cryptographic Key Generation
    q_id = hash_identity_to_group(vid)
    private_key_int = generate_private_key(q_id)
    
    return PrivateKeyResponse(
        vehicle_id=vid,
        private_key=str(private_key_int)
    )

@router.get("/public-parameters")
def get_public_parameters():
    return {
        "p": P,
        "g": G,
        "p_pub": get_master_public_key()
    }