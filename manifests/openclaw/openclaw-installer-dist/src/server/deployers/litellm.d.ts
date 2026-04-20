import type { DeployConfig } from "./types.js";
export declare const LITELLM_IMAGE = "ghcr.io/berriai/litellm:main-latest";
export declare const LITELLM_PORT = 4000;
export declare function generateLitellmMasterKey(): string;
/**
 * Returns true when the LiteLLM proxy should be used for this config.
 * On by default when Vertex is enabled with SA JSON credentials.
 */
export declare function shouldUseLitellmProxy(config: DeployConfig): boolean;
/**
 * Model name as registered in LiteLLM (no provider prefix).
 */
export declare function litellmModelName(config: DeployConfig): string;
/**
 * Full model string for OpenClaw config when using LiteLLM proxy.
 * Uses openai/ prefix so OpenClaw routes through the OpenAI-compatible client,
 * combined with MODEL_ENDPOINT pointing to LiteLLM.
 */
export declare function litellmModelString(config: DeployConfig): string;
/**
 * Generate litellm_config.yaml content as a YAML string.
 * We build it manually to avoid a js-yaml dependency.
 */
export declare function generateLitellmConfig(config: DeployConfig, masterKey: string): string;
