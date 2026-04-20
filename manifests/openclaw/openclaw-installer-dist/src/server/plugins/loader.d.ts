import type { DeployerRegistry } from "../deployers/registry.js";
export interface PluginConfig {
    plugins?: string[];
    disabled?: string[];
}
export declare function getDisabledModes(): Promise<string[]>;
export declare function setModeDisabled(mode: string, disabled: boolean): Promise<void>;
export declare function loadPlugins(registry: DeployerRegistry): Promise<void>;
