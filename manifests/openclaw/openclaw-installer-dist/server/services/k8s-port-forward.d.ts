export declare function ensureK8sPortForward(namespace: string): Promise<{
    localPort: number;
    url: string;
}>;
export declare function stopAllK8sPortForwards(): void;
