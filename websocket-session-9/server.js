
const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

const clients = new Map();

let clientCounter = 0;

// Send JSON to one client
function sendJSON(socket, message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

// Broadcast JSON to all clients except excluded socket
function broadcast(message, excludedSocket = null) {
    const jsonMessage = JSON.stringify(message);

    server.clients.forEach((client) => {
        if (
            client !== excludedSocket &&
            client.readyState === WebSocket.OPEN
        ) {
            client.send(jsonMessage);
        }
    });
}

// When a client connects
server.on("connection", (socket) => {
    const clientId = ++clientCounter;

    clients.set(socket, {
        id: clientId,
        username: `Client ${clientId}`,
        connectedAt: new Date()
    });

    console.log(`Client ${clientId} connected`);
    console.log(`Total clients: ${clients.size}`);

    // Receive messages
    socket.on("message", (data) => {
        let message;

        try {
            message = JSON.parse(data.toString());
        } catch {
            sendJSON(socket, {
                type: "error",
                payload: {
                    message: "Invalid JSON"
                },
                timestamp: Date.now()
            });

            return;
        }

        const clientInfo = clients.get(socket);

        // Handle username
        if (message.type === "set_username") {
            const username = message.payload?.username?.trim();

            if (!username) {
                sendJSON(socket, {
                    type: "error",
                    payload: {
                        message: "Username cannot be empty"
                    },
                    timestamp: Date.now()
                });

                return;
            }

            clientInfo.username = username;

            // Send welcome message
            sendJSON(socket, {
                type: "welcome",
                payload: {
                    clientId: clientInfo.id,
                    username: clientInfo.username,
                    message: `Welcome, ${clientInfo.username}!`
                },
                timestamp: Date.now()
            });

            // Notify other clients
            broadcast({
                type: "user_joined",
                payload: {
                    clientId: clientInfo.id,
                    username: clientInfo.username
                },
                timestamp: Date.now()
            }, socket);

            console.log(`${username} joined the chat`);

            return;
        }

        // Handle chat messages
        if (
            message.type === "chat" &&
            typeof message.payload?.text === "string" &&
            message.payload.text.trim() !== ""
        ) {
            const chatMessage = {
                type: "chat",
                payload: {
                    clientId: clientInfo.id,
                    username: clientInfo.username,
                    text: message.payload.text
                },
                timestamp: Date.now()
            };

            // Send message to other clients
            broadcast(chatMessage, socket);

            // Confirm message to sender
            sendJSON(socket, {
                type: "chat_sent",
                payload: {
                    message: message.payload.text
                },
                timestamp: Date.now()
            });
        } else {
            sendJSON(socket, {
                type: "error",
                payload: {
                    message: "Unsupported or invalid message"
                },
                timestamp: Date.now()
            });
        }
    });

    // When client disconnects
    socket.on("close", () => {
        const clientInfo = clients.get(socket);

        clients.delete(socket);

        console.log(`${clientInfo?.username} disconnected`);
        console.log(`Total clients: ${clients.size}`);

        // Notify remaining clients
        broadcast({
            type: "user_left",
            payload: {
                clientId: clientInfo?.id,
                username: clientInfo?.username
            },
            timestamp: Date.now()
        });
    });

    // Handle socket errors
    socket.on("error", (error) => {
        console.error("WebSocket error:", error.message);
    });
});

console.log("WebSocket server running at ws://localhost:8080");
