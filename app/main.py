from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.routers import auth
from typing import List

app = FastAPI(
    title="Secure V2V PKG Portal",
    description="Identity-Based Cryptography Private Key Generator for VANETs",
    version="1.0.0"
)

# Include the routes defined in auth.py
app.include_router(auth.router)

# Virtual V2V Airwave (WebSocket Manager)
class ConnectionManager:
    def __init__(self):
        # Keeps a list of all Android phones currently connected
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str, sender: WebSocket):
        # Sends the encrypted packet to everyone EXCEPT the sender
        for connection in self.active_connections:
            if connection != sender:
                await connection.send_text(message)

# Instantiate the manager
manager = ConnectionManager()

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

# Get the absolute path of the app directory
base_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(base_dir, "static")

# Mount the static directory
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def root():
    return FileResponse(os.path.join(static_dir, "index.html"))

# WebSocket Endpoint for V2V Communication
@app.websocket("/ws/v2v-network")
async def v2v_network(websocket: WebSocket):
    """
    This endpoint acts as the open airwaves. 
    It blindly routes encrypted V2V packets to all nearby vehicles.
    """
    await manager.connect(websocket)
    try:
        while True:
            # 1. Receive the encrypted packet from the sending car
            data = await websocket.receive_text()
            
            # 2. Broadcast it to all other connected cars
            await manager.broadcast(data, sender=websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)