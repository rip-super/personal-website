const socket = io();
const messageContainer = document.getElementById("message-container");
const sendForm = document.getElementById("send-container");
const input = document.getElementById("message-input");
const logoutBtn = document.getElementById("logout-button");
const container = document.getElementById("container");

container.addEventListener("animationend", (e) => {
    if (e.animationName === "fadeIn") {
        container.style.opacity = "1";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const html = document.documentElement;
    const icon = document.getElementById("theme-icon");

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentTheme = savedTheme || (prefersDark ? "dark" : "light");

    html.setAttribute("data-theme", currentTheme);
    updateIcon(currentTheme);

    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

    function toggleTheme() {
        const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
        html.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateIcon(newTheme);
    }

    function updateIcon(theme) {
        icon.classList.add("icon-transitioning");

        setTimeout(() => {
            if (theme === "dark") {
                icon.classList.remove("fa-sun");
                icon.classList.add("fa-moon");
            } else {
                icon.classList.remove("fa-moon");
                icon.classList.add("fa-sun");
            }
            icon.classList.remove("icon-transitioning");
        }, 250);
    }

    const dialog = document.getElementById("dialog-thing");
    const openBtn = document.getElementById("trash-button");
    const closeBtn = document.getElementById("closeBtn");
    const noBtn = document.getElementById("noBtn");
    let confirmedClose = false;

    openBtn.addEventListener("click", () => {
        dialog.showModal();
        dialog.classList.remove("closing");
    });

    closeBtn.addEventListener("click", () => {
        confirmedClose = true;
        dialog.classList.add("closing");
    });

    noBtn.addEventListener("click", () => {
        confirmedClose = false;
        dialog.classList.add("closing");
    });

    dialog.addEventListener("animationend", (event) => {
        if (event.animationName === "fadeSlideUp") {
            dialog.close();
            dialog.classList.remove("closing");

            if (confirmedClose) {
                socket.emit("delete-db");
            }
        }
    });
});

const params = new URLSearchParams(window.location.search);
const username = params.get("name") || "Anonymous";

socket.emit("join", username);

function appendMessage({ name, text, timestamp, isSystem = false, isSelf = false }) {
    const div = document.createElement("div");
    div.classList.add("message", "enter-animation");

    if (isSelf) {
        div.classList.add("self");
    } else if (!isSystem) {
        div.classList.add("other");
    }

    const time = timestamp
        ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
        : "";

    const nameLabel = isSystem
        ? ""
        : isSelf
            ? `${name} <span class="you-label">(You)</span>`
            : `${name}`;

    if (isSystem) {
        div.classList.add("system");
        div.innerHTML = `
        <div class="message-header system">
            <span class="system-text">${text}</span>
            <span class="timestamp">${time}</span>
        </div>
`;
        ;
    } else {
        div.innerHTML = `
        <div class="message-header">
            <span class="name">${nameLabel}</span>
            <span class="timestamp">${time}</span>
        </div>
        <div class="message-body">${text}</div>
    `;
    }

    messageContainer.appendChild(div);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    div.addEventListener("animationend", () => {
        div.classList.remove("enter-animation");
    });
}

socket.on("user-joined", ({ name, id }) => {
    const now = new Date().toISOString();
    const isSelf = id === socket.id;
    const text = isSelf
        ? `You (${name}) joined the chat`
        : `User "${name}" joined the chat`;
    appendMessage({ text, timestamp: now, isSystem: true });
});

socket.on("user-left", name => {
    const now = new Date().toISOString();
    appendMessage({ text: `User "${name}" left the chat`, timestamp: now, isSystem: true });
});

socket.on("chat-message", ({ name, text, timestamp }) => {
    appendMessage({ name, text, timestamp, isSelf: false });
});

socket.on("chat-history", (history) => {
    history.forEach(msg => {
        appendMessage({
            ...msg,
            isSystem: msg.name === "System",
            isSelf: msg.name === username
        });
    });
});

socket.on("reload-page", () => {
    document.body.classList.add("fade-out");

    setTimeout(() => {
        window.location.reload();
    }, 500);
});

sendForm.addEventListener("submit", e => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    const now = new Date().toISOString();
    appendMessage({ name: username, text: msg, timestamp: now, id: socket.id, isSelf: true });
    socket.emit("send-chat-message", msg);
    input.value = "";
});

logoutBtn.addEventListener("click", () => {
    document.body.classList.add("fade-out");

    setTimeout(() => {
        socket.disconnect();
        window.location.href = "/";
    }, 500);
});