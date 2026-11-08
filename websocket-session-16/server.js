const WebSocket = require("ws");

const wss = new WebSocket.Server({
    port: 8080
});

// Demo users and tokens
const users = {
    "yash-token-123": {
        id: "user-101",
        username: "Yash",
        role: "admin"
    },

    "rahul-token-456": {
        id: "user-102",
        username: "Aviraj",
        role: "user"
    }
};

wss.on("connection", (socket) => {

    console.log("New client connected");

    let authenticatedUser = null;

    // Give the client 10 seconds to authenticate.
    const authTimeout = setTimeout(() => {

        if (!authenticatedUser) {
            socket.close(1008, "Authentication required");
        }

    }, 10000);

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

        // Authentication must happen first.
        if (!authenticatedUser) {

            if (message.type !== "AUTH") {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    message: "Please authenticate first"
                }));
                return;
            }

            const user = users[message.token];

            if (!user) {
                socket.close(1008, "Invalid token");
                return;
            }

            authenticatedUser = user;

            clearTimeout(authTimeout);

            console.log(
                `${user.username} authenticated as ${user.role}`
            );

            socket.send(JSON.stringify({
                type: "AUTH_SUCCESS",
                userId: user.id,
                username: user.username,
                role: user.role
            }));

            return;
        }

        // Normal users and admins can chat.
        if (message.type === "CHAT") {

            console.log(
                `${authenticatedUser.username}: ${message.text}`
            );

            socket.send(JSON.stringify({
                type: "CHAT_SUCCESS",
                message: "Chat message received"
            }));

            return;
        }

        // Only admins can delete messages.
        if (message.type === "DELETE_MESSAGE") {

            if (authenticatedUser.role !== "admin") {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    message: "Permission denied"
                }));
                return;
            }

            console.log("Admin deleted a message");

            socket.send(JSON.stringify({
                type: "DELETE_SUCCESS"
            }));

            return;
        }

        socket.send(JSON.stringify({
            type: "ERROR",
            message: "Unknown message type"
        }));
    });

    socket.on("close", () => {

        clearTimeout(authTimeout);

        if (authenticatedUser) {
            console.log(
                `${authenticatedUser.username} disconnected`
            );
        } else {
            console.log("Unauthenticated client disconnected");
        }
    });

});

console.log("Authenticated WebSocket server running");
console.log("ws://localhost:8080");