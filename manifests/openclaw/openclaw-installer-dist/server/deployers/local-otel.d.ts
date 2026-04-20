import type { DeployConfig, LogCallback } from "./types.js";
export declare function otelContainerName(config: DeployConfig): string;
/**
 * Write the OTEL collector config into the data volume and start
 * the collector sidecar. Returns env vars to pass to the gateway.
 */
export declare function startOtelSidecar(config: DeployConfig, runtime: string, volumeName: string, podNameOrNull: string | null, litellmContainerOrNull: string | null, port: number, image: string, log: LogCallback, runCommand: (cmd: string, args: string[], log: LogCallback) => Promise<{
    code: number;
}>, removeContainer: (runtime: string, name: string) => Promise<void>): Promise<Record<string, string> | undefined>;
/**
 * Stop the OTEL sidecar container if it's running.
 */
export declare function stopOtelSidecar(config: DeployConfig, runtime: string, log: LogCallback, runCommand: (cmd: string, args: string[], log: LogCallback) => Promise<{
    code: number;
}>): Promise<void>;
export declare function jaegerContainerName(config: DeployConfig): string;
/**
 * Start Jaeger all-in-one as a sidecar in the pod.
 * Receives OTLP on 4317/4318, serves UI on 16686.
 */
export declare function startJaegerSidecar(config: DeployConfig, runtime: string, podNameStr: string, log: LogCallback, runCommand: (cmd: string, args: string[], log: LogCallback) => Promise<{
    code: number;
}>, removeContainer: (runtime: string, name: string) => Promise<void>): Promise<void>;
