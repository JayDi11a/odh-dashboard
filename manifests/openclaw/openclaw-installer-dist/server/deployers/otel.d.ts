import type { DeployConfig } from "./types.js";
export declare const OTEL_COLLECTOR_IMAGE = "ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector-contrib:0.120.0";
export declare const JAEGER_IMAGE = "jaegertracing/jaeger:2.16.0";
export declare const JAEGER_UI_PORT = 16686;
export declare const OTEL_GRPC_PORT = 4317;
export declare const OTEL_HTTP_PORT = 4318;
/**
 * Returns true when the OTEL collector sidecar should be deployed.
 */
export declare function shouldUseOtel(config: DeployConfig): boolean;
/**
 * Generate the OTEL collector config YAML.
 *
 * Supports two exporter modes:
 * - otlphttp: for MLflow, Grafana Tempo, or any OTLP/HTTP endpoint
 * - otlp (gRPC): for Jaeger, native OTLP collectors
 *
 * The config is generic — not OpenClaw-specific. Any containerized agent
 * that emits OTLP traces to localhost:4317/4318 will work.
 */
/**
 * Rewrite localhost endpoints for container networking.
 * Inside a pod/container, "localhost" is the pod itself, not the host machine.
 * For local deploys: podman uses host.containers.internal, docker uses host.docker.internal.
 * For K8s: endpoints should already be service DNS names, no rewrite needed.
 */
export declare function resolveEndpointForContainer(endpoint: string, runtime?: string): string;
export declare function generateOtelConfig(config: DeployConfig): string;
export declare function generateOtelConfigObject(config: DeployConfig): Record<string, unknown>;
/**
 * Environment variables to set on the agent container so it
 * knows where to send OTLP traces.
 */
export declare function otelAgentEnv(): Record<string, string>;
