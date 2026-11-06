from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Chat Stepan")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def now():
    return datetime.now().strftime("%H:%M:%S")


class ConnectionManager:
    def __init__(self):
        self.active = {}

    async def connect(self, name, socket):
        await socket.accept()
        self.active[name] = socket

    def disconnect(self, name):
        if name in self.active:
            del self.active[name]

    async def send_all(self, message, skip=None):
        gone = []
        for name, socket in self.active.items():
            if name == skip:
                continue
            try:
                await socket.send_json(message)
            except Exception:
                gone.append(name)
        for name in gone:
            self.disconnect(name)


manager = ConnectionManager()


@app.websocket("/ws/{name}")
async def chat(socket: WebSocket, name: str):
    await manager.connect(name, socket)
    await manager.send_all(
        {
            "type": "system",
            "username": name,
            "text": name + " подключился",
            "timestamp": now(),
        },
        skip=name,
    )
    try:
        while True:
            data = await socket.receive_json()
            text = str(data.get("text", "")).strip()
            if text == "":
                continue
            await manager.send_all(
                {
                    "type": "message",
                    "username": name,
                    "text": text,
                    "timestamp": now(),
                }
            )
    except WebSocketDisconnect:
        manager.disconnect(name)
        await manager.send_all(
            {
                "type": "system",
                "username": name,
                "text": name + " вышел",
                "timestamp": now(),
            },
            skip=name,
        )
