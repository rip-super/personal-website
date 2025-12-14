const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const Loki = require("lokijs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const db = new Loki("chat.db", {
    autoload: true,
    autoloadCallback: dbInit,
    autosave: false
});

let messages;
let deletingDB = false;

function dbInit() {
    messages = db.getCollection("messages");
    if (!messages) {
        messages = db.addCollection("messages", { indices: ["timestamp"] });
    }
}

function saveMessage(message) {
    messages.insert(message);
    db.saveDatabase();
}

const users = new Set();
const socketToUser = new Map();

app.use(express.json());

app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "index.html"));
});

app.use("/projects/chat_app", express.static(path.join(__dirname, "app", "chat")));

app.get("/projects/chat_app", (_, res) => {
    res.sendFile(path.join(__dirname, "app", "chat", "index.html"));
});

app.post("/login", (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ ok: false, error: "Invalid name" });
    }
    if (users.has(name)) {
        return res.status(409).json({ ok: false, error: "Error: Name in use. Please choose a different name." });
    }
    users.add(name);
    res.json({ ok: true });
});

io.on("connection", (socket) => {
    socket.on("join", (name) => {
        socketToUser.set(socket.id, name);
        users.add(name);
        console.log(`User joined: ${name} (socket: ${socket.id})`);

        const chatHistory = messages.chain().simplesort("timestamp").data();
        socket.emit("chat-history", chatHistory);
        saveMessage({
            name: "System",
            text: `User "${name}" joined the chat`,
            timestamp: new Date().toISOString()
        });

        io.emit("user-joined", { name, id: socket.id });
    });

    socket.on("send-chat-message", (msg) => {
        const name = socketToUser.get(socket.id) || "Anonymous";
        const timestamp = new Date().toISOString();
        console.log(`Message from ${name} (${socket.id}): ${msg}`);
        saveMessage({ name, text: msg, timestamp });
        socket.broadcast.emit("chat-message", { name, text: msg, timestamp });
    });

    socket.on("disconnect", () => {
        if (deletingDB) return;

        const name = socketToUser.get(socket.id);
        if (name) {
            users.delete(name);
            socketToUser.delete(socket.id);
            console.log(`User disconnected: ${name} (socket: ${socket.id})`);

            saveMessage({
                name: "System",
                text: `User "${name}" left the chat`,
                timestamp: new Date().toISOString()
            });

            socket.broadcast.emit("user-left", name);
        }
    });

    socket.on("delete-db", () => {
        deletingDB = true;
        db.removeCollection("messages");
        io.emit("reload-page");
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () =>
    console.log(`Server listening on port ${PORT}`)
);