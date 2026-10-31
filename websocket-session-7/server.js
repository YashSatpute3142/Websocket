
const WebSocket = require("ws");

const server = new WebSocket.Server({
    port: 8080
});

let clientCounter = 0;

console.log("WebSocket server running on port 8080");

function broadcast(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.on("connection", (socket) => {
    clientCounter++;

    const clientId = clientCounter;

    console.log(`Client ${clientId} connected`);

    socket.send(`Welcome! You are Client ${clientId}`);

    broadcast(`Client ${clientId} joined the chat`);

    socket.on("message", (data) => {
        const message = data.toString();

        console.log(`Client ${clientId}: ${message}`);

        broadcast(`Client ${clientId}: ${message}`);
    });

    socket.on("close", () => {
        console.log(`Client ${clientId} disconnected`);

        broadcast(`Client ${clientId} left the chat`);
    });

    socket.on("error", (error) => {
        console.error(`Client ${clientId} error:`, error.message);
    });
});
