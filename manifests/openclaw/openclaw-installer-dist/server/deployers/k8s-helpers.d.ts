import type { DeployConfig } from "./types.js";
export declare const DEFAULT_IMAGE: string;
export declare const DEFAULT_VERTEX_IMAGE: string;
export declare function defaultImage(config: DeployConfig): string;
export declare function tryParseProjectId(saJson: string): string;
export declare function sanitizeForRfc1123(value: string): string;
export declare function namespaceName(config: DeployConfig): string;
export declare function agentId(config: DeployConfig): string;
export declare function generateToken(): string;
export declare function normalizeModelRef(config: DeployConfig, modelRef: string): string;
export declare function buildDefaultAgentModelCatalog(modelRef: string): Record<string, {
    alias: string;
}>;
export declare function deriveModel(config: DeployConfig): string;
export declare function buildOpenClawConfig(config: DeployConfig, gatewayToken: string): object;
