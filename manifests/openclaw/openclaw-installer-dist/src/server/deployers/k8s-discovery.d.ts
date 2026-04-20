export interface K8sPodInfo {
    name: string;
    phase: string;
    ready: boolean;
    restarts: number;
    containerStatus: string;
    message: string;
}
export interface K8sInstance {
    namespace: string;
    status: "running" | "stopped" | "deploying" | "error" | "unknown";
    prefix: string;
    agentName: string;
    image: string;
    url: string;
    replicas: number;
    readyReplicas: number;
    pods: K8sPodInfo[];
    statusDetail: string;
}
export interface DiscoverK8sInstancesOptions {
    namespaces?: string[];
}
export declare function discoverK8sInstances(options?: DiscoverK8sInstancesOptions): Promise<K8sInstance[]>;
