from pydantic import BaseModel

class UserCredentials(BaseModel):
    vehicle_id: str
    password: str

class PrivateKeyResponse(BaseModel):
    vehicle_id: str
    private_key: str