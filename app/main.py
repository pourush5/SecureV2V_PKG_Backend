from fastapi import FastAPI
from app.routers import auth

app = FastAPI(
    title="Secure V2V PKG Portal",
    description="Identity-Based Cryptography Private Key Generator for VANETs",
    version="1.0.0"
)

# Include the routes defined in auth.py
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "PKG Portal is running. Visit /docs for the API schema."}
