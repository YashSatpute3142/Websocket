
const WebSocket = require("ws");

const server = new WebSocket.Server({
    port: 8080
});

console.log("JSON WebSocket server running on port 8080");

function sendJSON(socket, message) {
    socket.send(JSON.stringify(message));
}

function broadcastJSON(message) {
    const jsonMessage = JSON.stringify(message);

    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonMessage);
        }
    });
}

server.on("connection", (socket) => {
    console.log("Client connected");

    sendJSON(socket, {
        type: "status",
        payload: {
            message: "Connected to JSON WebSocket server"
        },
        timestamp: Date.now()
    });

    socket.on("message", (data) => {
        let message;

        // Step 1: Parse incoming JSON
        try {
            message = JSON.parse(data.toString());
        } catch (error) {
            sendJSON(socket, {
                type: "error",
                payload: {
                    message: "Invalid JSON"
                },
                timestamp: Date.now()
            });

            return;
        }

        // Step 2: Validate message structure
        if (
            typeof message !== "object" ||
            message === null ||
            Array.isArray(message)
        ) {
            sendJSON(socket, {
                type: "error",
                payload: {
                    message: "Message must be a JSON object"
                },
                timestamp: Date.now()
            });

            return;
        }

        // Step 3: Validate message type
        if (message.type !== "chat") {
            sendJSON(socket, {
                type: "error",
                payload: {
                    message: "Unsupported message type"
                },
                timestamp: Date.now()
            });

            return;
        }

        // Step 4: Validate chat payload
        if (
            !message.payload ||
            typeof message.payload.text !== "string" ||
            message.payload.text.trim() === ""
        ) {
            sendJSON(socket, {
                type: "error",
                payload: {
                    message: "Chat text is required"
                },
                timestamp: Date.now()
            });

            return;
        }

        // Step 5: Process valid message
        const response = {
            type: "chat",
            payload: {
                text: message.payload.text
            },
            timestamp: Date.now()
        };

        console.log("Valid chat message:", response);

        // Step 6: Broadcast to all connected clients
        broadcastJSON(response);
    });

    socket.on("close", () => {
        console.log("Client disconnected");
    });

    socket.on("error", (error) => {
        console.error("Socket error:", error.message);
    });
});
