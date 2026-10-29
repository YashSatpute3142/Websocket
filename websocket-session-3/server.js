const WebSocket = require("ws");

const server = new WebSocket.Server({
    port:8080,
});

console.log("websocket server listening on port 8080");

server.on("connection",(socket) => {
    console.log("client Connected");

    socket.send("Welcome! Websocket handSheck succeeded")

    socket.on("message",(data) => {
        const message = data.toString();

        console.log("Client Says: ", message );

        socket.send(`server recived: ${message}`);
    })

    socket.on("close",() => {
        console.log("client disconnected");
        
    })

    socket.on("error", (error) => {
        console.error("Client connection error", error.message);
        
    })
    
})
