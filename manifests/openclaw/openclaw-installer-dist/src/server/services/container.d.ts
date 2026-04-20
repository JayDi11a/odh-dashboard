export type ContainerRuntime = "podman" | "docker";
export declare function detectRuntime(): Promise<ContainerRuntime | null>;
export declare function isContainerRunning(runtime: ContainerRuntime, name: string): Promise<boolean>;
export declare function getContainerStatus(runtime: ContainerRuntime, name: string): Promise<"running" | "stopped" | "unknown">;
export declare function removeContainer(runtime: ContainerRuntime, name: string): Promise<void>;
export declare function removeVolume(runtime: ContainerRuntime, name: string): Promise<void>;
export interface DiscoveredVolume {
    name: string;
    /** The container name this volume belongs to (openclaw-<prefix>-<agent>) */
    containerName: string;
}
/**
 * Discover openclaw data volumes (openclaw-*-data pattern).
 * These represent instances that can be started even if no container exists.
 */
export declare function discoverVolumes(runtime: ContainerRuntime): Promise<DiscoveredVolume[]>;
export declare const OPENCLAW_LABELS: {
    managed: string;
    prefix: (v: string) => string;
    agent: (v: string) => string;
};
export interface DiscoveredContainer {
    name: string;
    status: "running" | "stopped" | "unknown";
    image: string;
    ports: string;
    labels: Record<string, string>;
    createdAt: string;
}
/**
 * Discover all OpenClaw containers — both installer-managed (by label)
 * and manually launched runtime containers (by image repo name "openclaw").
 */
export declare function discoverContainers(runtime: ContainerRuntime): Promise<DiscoveredContainer[]>;
