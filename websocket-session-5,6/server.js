const WebSocket = require("ws");

const server = new WebSocket.Server({
    port: 8080,
});

console.log("Websocket server runnig on port 8080");

server.on("connection", (socket) => {
    console.log("A Client connected");
    console.log(
        "Current client count:",
        server.clients.size
    );

    socket.send(
        "Connected clients: " + server.clients.size
    );

    socket.on("message", (data) => {
        const message = data.toString();
        console.log("Received: ", message);

        server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message)
            }
        })

    })
    socket.on("close", () => {
        console.log("A Client disconnected");

    })

    socket.on("error", (error) => {
        console.error("Websocket error: ", error.message);

    })

})
