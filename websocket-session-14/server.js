const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

// Demo-only deduplication store.
// This data disappears if the server restarts.
const processedMessages = new Map();

wss.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (rawMessage) => {
        let message;

        try {
            message = JSON.parse(rawMessage.toString());
        } catch {
            socket.send(JSON.stringify({
                type: "ERROR",
                message: "Invalid JSON"
            }));
            return;
        }

        // Validate the required fields.
        if (
            message.type !== "COMMAND" ||
            typeof message.messageId !== "string"
        ) {
            socket.send(JSON.stringify({
                type: "ERROR",
                message: "Invalid message format"
            }));
            return;
        }

        const { messageId, payload } = message;

        // Have we already processed this ID?
        if (processedMessages.has(messageId)) {
            console.log("Duplicate message:", messageId);

            // Send the saved ACK again, without repeating the action.
            socket.send(JSON.stringify(
                processedMessages.get(messageId)
            ));

            return;
        }

        // Process the new command.
        console.log("Processing command:", messageId);
        console.log("Payload:", payload);

        // In a real app, this is where the intended operation runs.
        const ack = {
            type: "ACK",
            messageId,
            status: "processed"
        };

        // Save the result before sending the ACK.
        processedMessages.set(messageId, ack);

        socket.send(JSON.stringify(ack));
    });

    socket.on("close", () => {
        console.log("Client disconnected");
    });
});

console.log("WebSocket server running on ws://localhost:8080");