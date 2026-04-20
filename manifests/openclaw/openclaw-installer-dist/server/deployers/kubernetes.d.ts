import type { Deployer, DeployConfig, DeployResult, LogCallback } from "./types.js";
export type { K8sPodInfo, K8sInstance } from "./k8s-discovery.js";
export { discoverK8sInstances } from "./k8s-discovery.js";
export declare class KubernetesDeployer implements Deployer {
    deploy(config: DeployConfig, log: LogCallback): Promise<DeployResult>;
    start(result: DeployResult, log: LogCallback): Promise<DeployResult>;
    status(result: DeployResult): Promise<DeployResult>;
    stop(result: DeployResult, log: LogCallback): Promise<void>;
    /**
     * Lightweight re-deploy: update agent ConfigMap from local files and
     * restart the pod. Secrets and other resources are left untouched.
     */
    redeploy(result: DeployResult, log: LogCallback): Promise<void>;
    teardown(result: DeployResult, log: LogCallback): Promise<void>;
}
