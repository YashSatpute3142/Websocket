const WebSocket = require("ws");

const wss = new WebSocket.Server({
    port: 8080
});

// Stores connected clients
const clients = new Map();

// Stores room members
const rooms = new Map();

// Stores username -> WebSocket
const users = new Map();

function send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

// Register user
wss.on("connection", (ws) => {

    console.log("New client connected");

    ws.on("message", (data) => {

        try {

            const message = JSON.parse(data.toString());

            // REGISTER
            if (message.type === "REGISTER") {

                const username = message.username;

                if (
                    typeof username !== "string" ||
                    !/^[a-zA-Z0-9_]{3,20}$/.test(username) ||
                    users.has(username)
                ) {
                    send(ws, {
                        type: "ERROR",
                        message: "Invalid or unavailable username"
                    });

                    return;
                }

                ws.username = username;

                clients.set(ws, username);
                users.set(username, ws);

                send(ws, {
                    type: "REGISTER_SUCCESS",
                    username
                });

                console.log(username, "registered");
            }

            // Require registration for other operations
            else if (!ws.username) {

                send(ws, {
                    type: "ERROR",
                    message: "Register first"
                });
            }

            // JOIN ROOM
            else if (message.type === "JOIN_ROOM") {

                const room = message.room;

                if (
                    typeof room !== "string" ||
                    !/^[a-zA-Z0-9_-]{1,30}$/.test(room)
                ) {
                    send(ws, {
                        type: "ERROR",
                        message: "Invalid room name"
                    });

                    return;
                }

                if (!rooms.has(room)) {
                    rooms.set(room, new Set());
                }

                rooms.get(room).add(ws.username);

                send(ws, {
                    type: "JOIN_SUCCESS",
                    room
                });

                broadcastRoom(room, {
                    type: "SYSTEM",
                    message: `${ws.username} joined ${room}`
                });
            }

            // LEAVE ROOM
            else if (message.type === "LEAVE_ROOM") {

                const room = message.room;

                if (rooms.has(room)) {

                    rooms.get(room).delete(ws.username);

                    if (rooms.get(room).size === 0) {
                        rooms.delete(room);
                    }

                    send(ws, {
                        type: "LEAVE_SUCCESS",
                        room
                    });
                }
            }

            // ROOM MESSAGE
            else if (message.type === "ROOM_MESSAGE") {

                const room = message.room;
                const text = message.text;

                if (
                    typeof room !== "string" ||
                    typeof text !== "string" ||
                    text.trim().length === 0 ||
                    text.length > 200
                ) {
                    send(ws, {
                        type: "ERROR",
                        message: "Invalid room message"
                    });

                    return;
                }

                if (!rooms.get(room)?.has(ws.username)) {
                    send(ws, {
                        type: "ERROR",
                        message: "Join the room first"
                    });

                    return;
                }

                broadcastRoom(room, {
                    type: "ROOM_MESSAGE",
                    room,
                    from: ws.username,
                    text
                });
            }

            // PRIVATE MESSAGE
            else if (message.type === "PRIVATE_MESSAGE") {

                const target = message.to;
                const text = message.text;

                if (
                    typeof target !== "string" ||
                    typeof text !== "string" ||
                    text.trim().length === 0 ||
                    text.length > 200
                ) {
                    send(ws, {
                        type: "ERROR",
                        message: "Invalid private message"
                    });

                    return;
                }

                const receiver = users.get(target);

                if (!receiver) {
                    send(ws, {
                        type: "ERROR",
                        message: "User not found"
                    });

                    return;
                }

                send(receiver, {
                    type: "PRIVATE_MESSAGE",
                    from: ws.username,
                    text
                });

                send(ws, {
                    type: "PRIVATE_SENT",
                    to: target
                });
            }

        } catch {

            send(ws, {
                type: "ERROR",
                message: "Invalid JSON"
            });
        }
    });

    // DISCONNECT
    ws.on("close", () => {

        const username = ws.username;

        if (!username) return;

        clients.delete(ws);

        // Remove username only if it still points to this connection
        if (users.get(username) === ws) {
            users.delete(username);
        }

        // Remove user from all rooms
        for (const [room, members] of rooms) {

            if (members.has(username)) {
                members.delete(username);

                broadcastRoom(room, {
                    type: "SYSTEM",
                    message: `${username} disconnected`
                });
            }

            if (members.size === 0) {
                rooms.delete(room);
            }
        }

        console.log(username, "disconnected");
    });
});

// Broadcast to room members
function broadcastRoom(room, data) {

    const members = rooms.get(room);

    if (!members) return;

    for (const username of members) {

        const client = users.get(username);

        if (client) {
            send(client, data);
        }
    }
}

console.log("WebSocket server running on port 8080");