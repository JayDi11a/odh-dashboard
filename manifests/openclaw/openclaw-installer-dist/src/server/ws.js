import { WebSocketServer, WebSocket } from "ws";
const sessions = new Map();
export function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === "subscribe" && msg.deployId) {
                    sessions.set(msg.deployId, { ws, deployId: msg.deployId });
                }
            }
            catch {
                // ignore invalid messages
            }
        });
        ws.on("close", () => {
            for (const [id, session] of sessions) {
                if (session.ws === ws) {
                    sessions.delete(id);
                }
            }
        });
    });
    return wss;
}
export function createLogCallback(deployId) {
    return (line) => {
        const session = sessions.get(deployId);
        if (session && session.ws.readyState === WebSocket.OPEN) {
            session.ws.send(JSON.stringify({ type: "log", deployId, line }));
        }
    };
}
export function sendStatus(deployId, status) {
    const session = sessions.get(deployId);
    if (session && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({ type: "status", deployId, status }));
    }
}
