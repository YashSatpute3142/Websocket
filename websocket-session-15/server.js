const WebSocket = require("ws");

const wss = new WebSocket.Server({
    port:8080
})

const MAX_BUFFER = 1024 * 

wss.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (message) => {

        // if (socket.bufferedAmount > MAX_BUFFER) {
        //     console.log("Client is too slow");
        //     socket.close(1013, "Slow client");
        //     return;
        // }

        
        
        console.log("Recived: ", message.length, "bytes");

        setTimeout(() => {
            if(socket.readyState === WebSocket.OPEN) {
                socket.send("Message Processed");
            }
        }, 1000)
        
    })

    socket.on("close", () => {
        console.log("Client disconnected");
        
    })
    
})

console.log("Server running on port 8080");

