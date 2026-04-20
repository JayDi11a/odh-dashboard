import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadTextTree } from "../state-tree.js";
export function loadAgentSourceBundle(config) {
    if (!config.agentSourceDir)
        return undefined;
    const bundlePath = join(config.agentSourceDir, "openclaw-agents.json");
    if (!existsSync(bundlePath))
        return undefined;
    try {
        return JSON.parse(readFileSync(bundlePath, "utf8"));
    }
    catch {
        return undefined;
    }
}
export async function loadAgentSourceWorkspaceTree(agentSourceDir) {
    if (!agentSourceDir)
        return [];
    return await loadTextTree(agentSourceDir);
}
export function loadAgentSourceCronJobs(agentSourceDir) {
    if (!agentSourceDir)
        return undefined;
    const cronPath = join(agentSourceDir, "cron", "jobs.json");
    if (!existsSync(cronPath))
        return undefined;
    try {
        return readFileSync(cronPath, "utf8");
    }
    catch {
        return undefined;
    }
}
