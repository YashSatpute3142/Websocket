const http = require("http");
const WebSocket = require("ws");

const server = http.createServer();

const wss = new WebSocket.Server({
    noServer: true,
    maxPayload: 1024 * 10
});

const allowedOrigins = [
    "http://localhost:5500"
];

server.on("upgrade", (request, socket, head) => {

    const origin = request.headers.origin;

    if (!allowedOrigins.includes(origin)) {
        console.log("Blocked connection from:", origin);

        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();

        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});

wss.on("connection", (ws) => {

    console.log("Secure client connected");

    ws.on("message", (data) => {

        try {
            const message = JSON.parse(data.toString());

            if (
                typeof message.text !== "string" ||
                message.text.length === 0 ||
                message.text.length > 200
            ) {
                ws.send(JSON.stringify({
                    type: "ERROR",
                    message: "Invalid message"
                }));

                return;
            }

            console.log("Received:", message.text);

            ws.send(JSON.stringify({
                type: "SUCCESS",
                message: "Message accepted"
            }));

        } catch {
            ws.send(JSON.stringify({
                type: "ERROR",
                message: "Invalid JSON"
            }));
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

server.listen(8080, () => {
    console.log("Secure WebSocket server running on port 8080");
});