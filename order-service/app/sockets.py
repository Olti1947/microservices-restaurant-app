import socketio

# Socket.IO server for live updates. Clients join a room:
#   "kitchen"   - kitchen screens, get every new order and status change
#   "table-<n>" - the diner at table n, gets status changes for that table
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ):
    print(f"Socket connected: {sid}")


@sio.event
async def join(sid, data):
    """Client sends {"room": "kitchen"} or {"room": "table-5"}."""
    room = data.get("room") if isinstance(data, dict) else None
    if room != "kitchen" and not (isinstance(room, str) and room.startswith("table-")):
        return {"ok": False, "error": "room must be 'kitchen' or 'table-<number>'"}
    await sio.enter_room(sid, room)
    print(f"Socket {sid} joined {room}")
    return {"ok": True, "room": room}


@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")
