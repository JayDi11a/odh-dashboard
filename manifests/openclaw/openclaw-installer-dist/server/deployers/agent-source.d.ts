import type { TreeEntry } from "../state-tree.js";
import type { DeployConfig } from "./types.js";
export interface AgentSourceAgentEntry {
    id: string;
    name?: string;
    workspaceDir?: string;
    model?: {
        primary?: string;
    };
    tools?: Record<string, unknown>;
    subagents?: {
        allowAgents?: string[];
    };
}
export interface AgentSourceBundle {
    mainAgent?: {
        tools?: Record<string, unknown>;
        subagents?: {
            allowAgents?: string[];
        };
    };
    agents?: AgentSourceAgentEntry[];
}
export declare function loadAgentSourceBundle(config: DeployConfig): AgentSourceBundle | undefined;
export declare function loadAgentSourceWorkspaceTree(agentSourceDir?: string): Promise<TreeEntry[]>;
export declare function loadAgentSourceCronJobs(agentSourceDir?: string): string | undefined;
