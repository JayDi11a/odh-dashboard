import {
  APIOptions,
  handleRestFailures,
  restGET,
  restCREATE,
  restDELETE,
  isModArchResponse,
} from 'mod-arch-core';

const URL_PREFIX = '/openclaw';
const BFF_API_VERSION = 'v1';

export interface DeploymentConfig {
  agentName: string;
  namespace?: string;
  modelProvider: 'anthropic' | 'openai' | 'vertex' | 'vllm';
  modelName: string;
  modelEndpoint?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  gcpServiceAccountJson?: string;
  image?: string;
  sandboxEnabled?: boolean;
  sandboxBackend?: 'ssh' | 'local';
  routeHost?: string;
}

export interface DeploymentResult {
  success: boolean;
  error?: string;
  agentName: string;
  namespace: string;
  routeURL: string;
  gatewayToken?: string;
}

export interface InstanceStatus {
  name: string;
  namespace: string;
  status: string;
  routeUrl: string;
  gatewayToken?: string;
  createdAt: string;
}

export interface ListInstancesResult {
  instances: InstanceStatus[];
}

export const deployInstance =
  (hostPath: string) =>
  (opts: APIOptions, config: DeploymentConfig): Promise<DeploymentResult> =>
    handleRestFailures(
      restCREATE(
        hostPath,
        `${URL_PREFIX}/api/${BFF_API_VERSION}/instances`,
        config as unknown as Record<string, unknown>,
        {},
        opts,
      ),
    ).then((response) => {
      if (isModArchResponse<DeploymentResult>(response)) {
        return response.data;
      }
      throw new Error('Invalid response format');
    });

export const listInstances =
  (hostPath: string) =>
  (opts: APIOptions): Promise<ListInstancesResult> =>
    handleRestFailures(
      restGET(hostPath, `${URL_PREFIX}/api/${BFF_API_VERSION}/instances`, {}, opts),
    ).then((response) => {
      if (isModArchResponse<ListInstancesResult>(response)) {
        return response.data;
      }
      throw new Error('Invalid response format');
    });

export const getInstance =
  (hostPath: string) =>
  (opts: APIOptions, name: string, namespace: string): Promise<InstanceStatus> =>
    handleRestFailures(
      restGET(
        hostPath,
        `${URL_PREFIX}/api/${BFF_API_VERSION}/instances/${name}`,
        { namespace },
        opts,
      ),
    ).then((response) => {
      if (isModArchResponse<InstanceStatus>(response)) {
        return response.data;
      }
      throw new Error('Invalid response format');
    });

export const deleteInstance =
  (hostPath: string) =>
  (opts: APIOptions, name: string, namespace: string): Promise<{ success: boolean }> =>
    handleRestFailures(
      restDELETE(
        hostPath,
        `${URL_PREFIX}/api/${BFF_API_VERSION}/instances/${name}`,
        {},
        { namespace },
        opts,
      ),
    ).then((response) => {
      if (isModArchResponse<{ success: boolean }>(response)) {
        return response.data;
      }
      throw new Error('Invalid response format');
    });
