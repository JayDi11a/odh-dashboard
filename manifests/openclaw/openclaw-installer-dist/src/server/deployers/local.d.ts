import type { Deployer, DeployConfig, DeployResult, LogCallback } from "./types.js";
/** Returns true if the image tag is `:latest` or absent — mutable tags that should always be pulled. */
export declare function shouldAlwaysPull(image: string): boolean;
export declare class LocalDeployer implements Deployer {
    deploy(config: DeployConfig, log: LogCallback): Promise<DeployResult>;
    start(result: DeployResult, log: LogCallback): Promise<DeployResult>;
    status(result: DeployResult): Promise<DeployResult>;
    private readSavedToken;
    /**
     * Extract instance info from running container and save to
     * ~/.openclaw/installer/local/<name>/ on the host:
     *   - gateway-token (auth token)
     *   - .env (all env vars for the instance, secrets redacted with comment)
     */
    private saveInstanceInfo;
    /**
     * Lightweight re-deploy: copy updated agent files from the host into
     * the data volume and restart the container.
     */
    redeploy(result: DeployResult, log: LogCallback): Promise<void>;
    stop(result: DeployResult, log: LogCallback): Promise<void>;
    teardown(result: DeployResult, log: LogCallback): Promise<void>;
}
