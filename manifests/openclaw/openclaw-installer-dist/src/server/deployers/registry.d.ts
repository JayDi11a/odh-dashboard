import type { Deployer } from "./types.js";
export type PluginSource = "built-in" | "provider-plugin" | "npm" | "config";
export interface DeployerRegistration {
    mode: string;
    title: string;
    description: string;
    deployer: Deployer;
    detect?: () => Promise<boolean>;
    unavailableReason?: string;
    priority?: number;
    builtIn?: boolean;
    source?: PluginSource;
}
export interface PluginLoadError {
    pluginId: string;
    error: string;
}
export interface InstallerPlugin {
    register(registry: DeployerRegistry): void;
}
export declare class DeployerRegistry {
    private registrations;
    private _loadErrors;
    /** Set before calling plugin.register() so that source is auto-applied. */
    currentSource: PluginSource;
    register(reg: DeployerRegistration): void;
    get(mode: string): Deployer | null;
    list(): DeployerRegistration[];
    addLoadError(err: PluginLoadError): void;
    loadErrors(): PluginLoadError[];
    detect(): Promise<DeployerRegistration[]>;
}
export declare const registry: DeployerRegistry;
