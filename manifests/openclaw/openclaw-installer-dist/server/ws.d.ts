import { WebSocketServer } from "ws";
import type { Server } from "node:http";
export declare function setupWebSocket(server: Server): WebSocketServer;
export declare function createLogCallback(deployId: string): (line: string) => void;
export declare function sendStatus(deployId: string, status: string): void;
