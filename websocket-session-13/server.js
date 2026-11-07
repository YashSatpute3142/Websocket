const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

// Store whether each client is responsive
function markAlive(socket) {
    socket.isAlive = true;
}

server.on("connection", (socket) => {
    console.log("Client connected");

    // Initially consider the client alive
    markAlive(socket);

    // Client responds to Ping with Pong.
    // The ws library automatically sends Pong frames.
    socket.on("pong", () => {
        markAlive(socket);
        console.log("Pong received from client");
    });

    socket.on("message", (data) => {
        console.log("Message:", data.toString());
    });

    socket.on("close", () => {
        console.log("Client disconnected");
    });

    socket.on("error", (error) => {
        console.error("Socket error:", error.message);
    });
});

// Send Ping every 5 seconds
const heartbeatInterval = setInterval(() => {
    server.clients.forEach((socket) => {
        // If the client did not respond to the previous Ping
        if (socket.isAlive === false) {
            console.log("Client did not respond. Terminating.");
            return socket.terminate();
        }

        // Mark as not yet responsive
        socket.isAlive = false;

        // Send Ping frame
        socket.ping();
        console.log("Ping sent to client");
    });
}, 5000);

// Stop interval when server closes
server.on("close", () => {
    clearInterval(heartbeatInterval);
});

console.log("Heartbeat server running at ws://localhost:8080");