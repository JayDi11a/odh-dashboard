import * as k8s from "@kubernetes/client-node";
/**
 * Load kubeconfig from default locations (~/.kube/config or in-cluster SA).
 * Cached after first call.
 */
export declare function loadKubeConfig(): k8s.KubeConfig;
/** Reset cached config (useful if context changes). */
export declare function resetKubeConfig(): void;
export declare function coreApi(): k8s.CoreV1Api;
export declare function appsApi(): k8s.AppsV1Api;
/**
 * Check if we can connect to a K8s cluster at all.
 */
export declare function isClusterReachable(): Promise<boolean>;
/**
 * Check whether the OpenTelemetry Operator CRD is installed on the cluster.
 */
export declare function hasOtelOperator(): Promise<boolean>;
export declare function currentContext(): string;
export declare function currentNamespace(): string;
export declare function k8sApiHttpCode(err: unknown): number | undefined;
