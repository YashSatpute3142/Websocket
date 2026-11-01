const WebSocket =  require("ws");

const server  = new WebSocket.Server({
    port:8080,
})

server.on("connection", (socket) => {
    console.log("Client Connectecd");

    socket.send(JSON.stringify({
        type:"welcome",
        payload: {
            message:"Connected to  webscoket"
        }
    }))

    socket.on("message", (data) => {
        console.log(`Recived: ${data.toString()}`);

        socket.send(JSON.stringify({
            type:"echo",
            payload: {
                message: data.toString()
            }
        }))

        socket.on("close", () => {
        console.log("Client disconnected");
    });

    socket.on("error", (error) => {
        console.log("Socket error:", error.message);
    });
        
    })
    
})

console.log("Server running at ws://localhost:8080");