const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

let clientCounter = 0;

// Send a JSON message to one client
function sendJSON(socket, message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

// Send a structured error response
function sendError(socket, requestId, code, message) {
    sendJSON(socket, {
        type: "error",
        id: requestId ?? null,
        payload: {
            code,
            message
        },
        timestamp: Date.now()
    });
}

// Handle client connections
server.on("connection", (socket) => {
    const clientId = ++clientCounter;

    console.log(`Client ${clientId} connected`);

    socket.on("message", (data) => {
        let message;

        // Parse incoming JSON
        try {
            message = JSON.parse(data.toString());
        } catch {
            sendError(
                socket,
                null,
                "INVALID_JSON",
                "Message must be valid JSON"
            );

            return;
        }

        // Validate basic message structure
        if (
            typeof message.type !== "string" ||
            typeof message.id !== "string" ||
            typeof message.payload !== "object" ||
            message.payload === null ||
            Array.isArray(message.payload)
        ) {
            sendError(
                socket,
                message.id,
                "INVALID_MESSAGE",
                "Message structure is invalid"
            );

            return;
        }

        // Handle client count request
        if (message.type === "get_client_count") {
            sendJSON(socket, {
                type: "client_count",
                id: message.id,
                payload: {
                    count: server.clients.size
                },
                timestamp: Date.now()
            });
        }

        // Handle chat message
        else if (message.type === "chat") {
            const text = message.payload.text;

            if (
                typeof text !== "string" ||
                text.trim() === ""
            ) {
                sendError(
                    socket,
                    message.id,
                    "INVALID_CHAT",
                    "Chat text cannot be empty"
                );

                return;
            }

            console.log(`Client ${clientId}: ${text}`);

            // Acknowledge successful processing
            sendJSON(socket, {
                type: "ack",
                id: message.id,
                payload: {
                    success: true,
                    message: "Chat message processed"
                },
                timestamp: Date.now()
            });
        }

        // Handle unknown message types
        else {
            sendError(
                socket,
                message.id,
                "UNKNOWN_MESSAGE_TYPE",
                `Unsupported message type: ${message.type}`
            );
        }
    });

    socket.on("close", () => {
        console.log(`Client ${clientId} disconnected`);
    });

    socket.on("error", (error) => {
        console.error("WebSocket error:", error.message);
    });
});

console.log("WebSocket server running at ws://localhost:8080");