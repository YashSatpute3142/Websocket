const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

let clientCounter = 0;

server.on("connection", (socket) => {
    const clientId = ++clientCounter;

    console.log(`Client ${clientId} connected`);
    console.log(`Active clients: ${server.clients.size}`);

    // Send a welcome message
    socket.send(JSON.stringify({
        type: "welcome",
        payload: {
            clientId,
            message: "Connection established"
        }
    }));

    // Handle incoming messages
    socket.on("message", (data) => {
        console.log(
            `Client ${clientId} sent: ${data.toString()}`
        );

        socket.send(JSON.stringify({
            type: "message_received",
            payload: {
                message: data.toString()
            }
        }));
    });

    // Handle client disconnection
    socket.on("close", (code, reason) => {
        console.log(`Client ${clientId} disconnected`);
        console.log(`Close code: ${code}`);
        console.log(`Reason: ${reason.toString()}`);
        console.log(`Active clients: ${server.clients.size}`);
    });

    
    socket.on("error", (error) => {
        console.error(
            `Client ${clientId} socket error:`,
            error.message
        );
    });
});

console.log("Server running at ws://localhost:8080");