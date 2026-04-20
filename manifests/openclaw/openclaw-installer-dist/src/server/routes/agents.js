import { Router } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, stat, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { v4 as uuid } from "uuid";
const execFileAsync = promisify(execFile);
const router = Router();
async function scanForAgents(dir) {
    const agents = [];
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith("_"))
                continue;
            const agentDir = join(dir, entry.name);
            const hasAgentsMd = await stat(join(agentDir, "AGENTS.md.envsubst"))
                .then(() => true)
                .catch(() => false);
            if (!hasAgentsMd)
                continue;
            const hasJobMd = await stat(join(agentDir, "JOB.md"))
                .then(() => true)
                .catch(() => false);
            let description;
            try {
                const content = await readFile(join(agentDir, "AGENTS.md.envsubst"), "utf-8");
                const descMatch = content.match(/^description:\s*(.+)$/m);
                if (descMatch)
                    description = descMatch[1].trim();
            }
            catch {
                // ignore
            }
            agents.push({
                id: entry.name,
                path: agentDir,
                hasAgentsMd,
                hasJobMd,
                description,
            });
        }
    }
    catch {
        // directory doesn't exist or can't be read
    }
    return agents;
}
// Browse agents from a public git repo
router.get("/browse", async (req, res) => {
    const repo = req.query.repo;
    const path = req.query.path || "agents";
    if (!repo) {
        res.status(400).json({ error: "repo query parameter required" });
        return;
    }
    const tmpDir = join(tmpdir(), `openclaw-browse-${uuid()}`);
    try {
        await execFileAsync("git", [
            "clone",
            "--depth",
            "1",
            "--sparse",
            repo,
            tmpDir,
        ]);
        const agents = await scanForAgents(join(tmpDir, path));
        res.json(agents);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: `Failed to browse repo: ${message}` });
    }
    finally {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => { });
    }
});
// List local agents (from this repo)
router.get("/local", async (_req, res) => {
    const repoAgentsDir = join(import.meta.dirname, "..", "..", "..", "..", "agents", "openclaw", "agents");
    const agents = await scanForAgents(repoAgentsDir);
    res.json(agents);
});
export default router;
