import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export async function detectRuntime() {
    for (const rt of ["podman", "docker"]) {
        try {
            await execFileAsync(rt, ["--version"]);
            return rt;
        }
        catch {
            // not found, try next
        }
    }
    return null;
}
export async function isContainerRunning(runtime, name) {
    try {
        const { stdout } = await execFileAsync(runtime, [
            "inspect",
            "--format",
            "{{.State.Running}}",
            name,
        ]);
        return stdout.trim() === "true";
    }
    catch {
        return false;
    }
}
export async function getContainerStatus(runtime, name) {
    try {
        const { stdout } = await execFileAsync(runtime, [
            "inspect",
            "--format",
            "{{.State.Status}}",
            name,
        ]);
        const status = stdout.trim();
        if (status === "running")
            return "running";
        return "stopped";
    }
    catch {
        return "unknown";
    }
}
export async function removeContainer(runtime, name) {
    try {
        await execFileAsync(runtime, ["rm", "-f", name]);
    }
    catch {
        // ignore if not found
    }
}
export async function removeVolume(runtime, name) {
    try {
        await execFileAsync(runtime, ["volume", "rm", name]);
    }
    catch {
        // ignore if not found
    }
}
/**
 * Discover openclaw data volumes (openclaw-*-data pattern).
 * These represent instances that can be started even if no container exists.
 */
export async function discoverVolumes(runtime) {
    try {
        const { stdout } = await execFileAsync(runtime, [
            "volume",
            "ls",
            "--format",
            "{{.Name}}",
        ]);
        return stdout
            .trim()
            .split("\n")
            .filter((name) => name.match(/^openclaw-.+-data$/))
            .map((name) => ({
            name,
            // openclaw-sally-lynx-data -> openclaw-sally-lynx
            containerName: name.replace(/-data$/, ""),
        }));
    }
    catch {
        return [];
    }
}
// Labels used by the installer to tag containers it creates
export const OPENCLAW_LABELS = {
    managed: "openclaw.managed=true",
    prefix: (v) => `openclaw.prefix=${v}`,
    agent: (v) => `openclaw.agent=${v}`,
};
function isOpenClawRuntimeImage(image) {
    const normalized = image.trim().toLowerCase();
    if (!normalized)
        return false;
    const withoutDigest = normalized.split("@")[0];
    const lastSegment = withoutDigest.split("/").pop() || withoutDigest;
    const repoName = lastSegment.split(":")[0];
    return repoName === "openclaw";
}
/**
 * Discover all OpenClaw containers — both installer-managed (by label)
 * and manually launched runtime containers (by image repo name "openclaw").
 */
export async function discoverContainers(runtime) {
    try {
        // Get ALL containers (running + stopped) as JSON
        const { stdout } = await execFileAsync(runtime, [
            "ps",
            "-a",
            "--format",
            "json",
        ]);
        if (!stdout.trim())
            return [];
        // podman outputs one JSON object per line; docker outputs a JSON array
        let containers;
        const trimmed = stdout.trim();
        if (trimmed.startsWith("[")) {
            containers = JSON.parse(trimmed);
        }
        else {
            // podman: one JSON object per line
            containers = trimmed
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line));
        }
        const results = [];
        for (const c of containers) {
            // Normalize field names (podman uses PascalCase, docker uses lowercase)
            const image = String(c.Image || c.image || "");
            const names = c.Names || c.names;
            const name = Array.isArray(names)
                ? names[0]
                : String(names || "").replace(/^\//, "");
            const state = String(c.State || c.state || "");
            const labels = c.Labels || {};
            const created = String(c.CreatedAt || c.Created || c.created || "");
            const ports = c.Ports || c.ports || "";
            const portsStr = Array.isArray(ports) ? JSON.stringify(ports) : String(ports);
            // Match by installer label OR by the OpenClaw runtime image name.
            // Exclude installer images like openclaw-installer from local instances.
            const hasLabel = labels["openclaw.managed"] === "true";
            const hasImage = isOpenClawRuntimeImage(image);
            if (!hasLabel && !hasImage)
                continue;
            let status = "unknown";
            const stateLower = state.toLowerCase();
            if (stateLower === "running")
                status = "running";
            else if (stateLower === "exited" ||
                stateLower === "stopped" ||
                stateLower === "created")
                status = "stopped";
            results.push({
                name,
                status,
                image,
                ports: portsStr,
                labels,
                createdAt: created,
            });
        }
        return results;
    }
    catch {
        return [];
    }
}
