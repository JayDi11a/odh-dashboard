/**
 * OpenClaw deployment configuration types
 * Maps to the OpenClaw installer's DeployConfig interface
 */

export type ModelProvider = 'anthropic' | 'openai' | 'vertex' | 'vllm';

export interface DeploymentConfig {
  // Instance metadata
  agentName: string;
  namespace?: string;

  // Model configuration
  modelProvider: ModelProvider;
  modelName: string;
  modelEndpoint?: string; // For vLLM or custom endpoints

  // Credentials (stored as SecretRefs)
  anthropicApiKey?: string;
  openaiApiKey?: string;
  gcpServiceAccountJson?: string;

  // Workspace settings
  image?: string;
  sandboxEnabled?: boolean;
  sandboxBackend?: 'ssh' | 'local';

  // OpenShift-specific
  routeHost?: string;
}

export interface DeploymentResult {
  success: boolean;
  agentName: string;
  namespace: string;
  routeUrl?: string;
  gatewayToken?: string;
  error?: string;
}

export interface InstanceStatus {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Failed' | 'Unknown';
  routeUrl?: string;
  gatewayToken?: string;
  modelProvider?: ModelProvider;
  modelName?: string;
  createdAt?: string;
}

export interface ListInstancesResult {
  instances: InstanceStatus[];
}
