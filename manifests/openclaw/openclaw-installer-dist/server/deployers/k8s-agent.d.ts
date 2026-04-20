import type { DeployConfig, LogCallback } from "./types.js";
export declare function buildAgentsMd(config: DeployConfig): string;
export declare function buildAgentJson(config: DeployConfig): string;
export declare function buildSoulMd(config: DeployConfig): string;
export declare function buildIdentityMd(config: DeployConfig): string;
export declare function buildToolsMd(config: DeployConfig): string;
export declare function buildUserMd(config: DeployConfig): string;
export declare function buildHeartbeatMd(): string;
export declare function buildMemoryMd(): string;
export declare const WORKSPACE_FILES: Record<string, (config: DeployConfig) => string>;
/**
 * Load agent workspace files, preferring user-customized files from
 * ~/.openclaw/workspace-<agentId>/ over generated defaults.
 * Saves generated defaults to the host dir if they don't already exist.
 */
export declare function loadWorkspaceFiles(config: DeployConfig, log: LogCallback): {
    files: Record<string, string>;
    fromHost: boolean;
};
