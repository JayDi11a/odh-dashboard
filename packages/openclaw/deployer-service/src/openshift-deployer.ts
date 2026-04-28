/**
 * OpenShift Deployer - Wraps OpenClaw installer's OpenShift deployer logic
 *
 * This module adapts the openclaw-installer's OpenShift provider plugin
 * to be callable as a service by the Go BFF.
 */

import * as k8s from '@kubernetes/client-node';
import { v4 as uuid } from 'uuid';
import type { DeploymentConfig, DeploymentResult, InstanceStatus } from './types.js';

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);
const routeApi = kc.makeApiClient(k8s.CustomObjectsApi);

/**
 * Generate namespace name for OpenClaw instance
 */
function namespaceName(agentName: string): string {
  return `openclaw-${agentName}`;
}

/**
 * Create OAuth ServiceAccount for OpenShift
 */
function createServiceAccount(namespace: string): k8s.V1ServiceAccount {
  return {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: {
      name: 'openclaw-oauth-proxy',
      namespace,
      annotations: {
        'serviceaccounts.openshift.io/oauth-redirectreference.first': JSON.stringify({
          kind: 'OAuthRedirectReference',
          apiVersion: 'v1',
          reference: {
            kind: 'Route',
            name: 'openclaw',
          },
        }),
      },
    },
  };
}

/**
 * Create OAuth config secret
 */
async function createOAuthSecret(namespace: string): Promise<k8s.V1Secret> {
  const cookieSecret = Buffer.from(uuid()).toString('base64');

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'openclaw-oauth-config',
      namespace,
    },
    type: 'Opaque',
    data: {
      'cookie-secret': cookieSecret,
    },
  };
}

/**
 * Create OpenClaw secrets (API keys, credentials, gateway token)
 */
function createOpenClawSecrets(
  namespace: string,
  config: DeploymentConfig,
  gatewayToken: string,
): k8s.V1Secret {
  const secretData: Record<string, string> = {};

  // Store gateway token
  secretData['gateway-token'] = Buffer.from(gatewayToken).toString('base64');

  if (config.anthropicApiKey) {
    secretData['anthropic-api-key'] = Buffer.from(config.anthropicApiKey).toString('base64');
  }
  if (config.openaiApiKey) {
    secretData['openai-api-key'] = Buffer.from(config.openaiApiKey).toString('base64');
  }
  if (config.gcpServiceAccountJson) {
    secretData['gcp-sa-key'] = Buffer.from(config.gcpServiceAccountJson).toString('base64');
  }

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'openclaw-secrets',
      namespace,
      labels: {
        'app.kubernetes.io/name': 'openclaw',
        'app.kubernetes.io/instance': config.agentName,
      },
    },
    type: 'Opaque',
    data: secretData,
  };
}

/**
 * Create OpenClaw Deployment with OAuth proxy sidecar
 */
function createDeployment(namespace: string, config: DeploymentConfig): k8s.V1Deployment {
  const image =
    config.image ||
    process.env.OPENCLAW_IMAGE ||
    'image-registry.openshift-image-registry.svc:5000/opendatahub/openclaw-module:latest';

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'openclaw',
      namespace,
      labels: {
        app: 'openclaw',
        'app.kubernetes.io/name': 'openclaw',
        'app.kubernetes.io/instance': config.agentName,
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'openclaw',
        },
      },
      template: {
        metadata: {
          labels: {
            app: 'openclaw',
          },
        },
        spec: {
          serviceAccountName: 'openclaw-oauth-proxy',
          containers: [
            // OpenClaw container
            {
              name: 'openclaw',
              image,
              ports: [
                {
                  containerPort: 18789,
                  name: 'gateway',
                  protocol: 'TCP',
                },
              ],
              env: [
                {
                  name: 'MODEL_PROVIDER',
                  value: config.modelProvider,
                },
                {
                  name: 'MODEL_NAME',
                  value: config.modelName,
                },
                // DEV_MODE for development/testing (bypasses authentication)
                {
                  name: 'DEV_MODE',
                  value: 'true',
                },
                // Gateway token from secret
                {
                  name: 'GATEWAY_TOKEN',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'openclaw-secrets',
                      key: 'gateway-token',
                    },
                  },
                },
                // Add API key from secret
                ...(config.anthropicApiKey
                  ? [
                      {
                        name: 'ANTHROPIC_API_KEY',
                        valueFrom: {
                          secretKeyRef: {
                            name: 'openclaw-secrets',
                            key: 'anthropic-api-key',
                          },
                        },
                      },
                    ]
                  : []),
                ...(config.openaiApiKey
                  ? [
                      {
                        name: 'OPENAI_API_KEY',
                        valueFrom: {
                          secretKeyRef: {
                            name: 'openclaw-secrets',
                            key: 'openai-api-key',
                          },
                        },
                      },
                    ]
                  : []),
              ],
            },
            // OAuth proxy sidecar
            {
              name: 'oauth-proxy',
              image:
                process.env.OAUTH_PROXY_IMAGE ||
                'image-registry.openshift-image-registry.svc:5000/openshift/oauth-proxy:v4.4',
              ports: [
                {
                  containerPort: 8443,
                  name: 'oauth-ui',
                  protocol: 'TCP',
                },
              ],
              args: [
                '--https-address=:8443',
                '--provider=openshift',
                '--openshift-service-account=openclaw-oauth-proxy',
                '--upstream=http://localhost:18789',
                '--tls-cert=/etc/tls/private/tls.crt',
                '--tls-key=/etc/tls/private/tls.key',
                '--cookie-secret-file=/etc/oauth/cookie-secret',
                '--skip-auth-regex=.*', // Skip authentication for dev/testing
              ],
              volumeMounts: [
                {
                  name: 'proxy-tls',
                  mountPath: '/etc/tls/private',
                },
                {
                  name: 'oauth-config',
                  mountPath: '/etc/oauth',
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'proxy-tls',
              secret: {
                secretName: 'openclaw-proxy-tls',
              },
            },
            {
              name: 'oauth-config',
              secret: {
                secretName: 'openclaw-oauth-config',
              },
            },
          ],
        },
      },
    },
  };
}

/**
 * Create Service for OpenClaw
 */
function createService(namespace: string): k8s.V1Service {
  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: 'openclaw',
      namespace,
      labels: {
        app: 'openclaw',
      },
      annotations: {
        'service.beta.openshift.io/serving-cert-secret-name': 'openclaw-proxy-tls',
      },
    },
    spec: {
      type: 'ClusterIP',
      selector: {
        app: 'openclaw',
      },
      ports: [
        {
          name: 'gateway',
          port: 18789,
          targetPort: 18789 as any,
          protocol: 'TCP',
        },
        {
          name: 'oauth-ui',
          port: 8443,
          targetPort: 8443 as any,
          protocol: 'TCP',
        },
      ],
    },
  };
}

/**
 * Create OpenShift Route
 */
function createRoute(namespace: string, agentName: string) {
  return {
    apiVersion: 'route.openshift.io/v1',
    kind: 'Route',
    metadata: {
      name: 'openclaw',
      namespace,
      labels: {
        app: 'openclaw',
        'app.kubernetes.io/instance': agentName,
      },
    },
    spec: {
      to: {
        kind: 'Service',
        name: 'openclaw',
        weight: 100,
      },
      port: {
        targetPort: 'oauth-ui',
      },
      tls: {
        termination: 'reencrypt',
        insecureEdgeTerminationPolicy: 'Redirect',
      },
    },
  };
}

/**
 * Deploy OpenClaw instance to OpenShift
 */
export async function deployInstance(config: DeploymentConfig): Promise<DeploymentResult> {
  const ns = config.namespace || namespaceName(config.agentName);

  // Generate gateway token for this instance
  const gatewayToken = uuid();

  try {
    // 1. Create namespace
    try {
      await coreApi.createNamespace({
        body: {
          metadata: {
            name: ns,
            labels: {
              'app.kubernetes.io/managed-by': 'odh-openclaw',
              'app.kubernetes.io/instance': config.agentName,
            },
          },
        },
      });
      console.log(`Created namespace: ${ns}`);
    } catch (err: any) {
      if (err.statusCode !== 409) throw err; // Ignore if exists
      console.log(`Namespace ${ns} already exists`);
    }

    // 2. Create ServiceAccount
    const sa = createServiceAccount(ns);
    await coreApi.createNamespacedServiceAccount({ namespace: ns, body: sa });
    console.log('Created ServiceAccount');

    // 3. Create OAuth secret
    const oauthSecret = await createOAuthSecret(ns);
    await coreApi.createNamespacedSecret({ namespace: ns, body: oauthSecret });
    console.log('Created OAuth secret');

    // 4. Create OpenClaw secrets (including gateway token)
    const openclawSecrets = createOpenClawSecrets(ns, config, gatewayToken);
    await coreApi.createNamespacedSecret({ namespace: ns, body: openclawSecrets });
    console.log('Created OpenClaw secrets');

    // 5. Create Service
    const service = createService(ns);
    await coreApi.createNamespacedService({ namespace: ns, body: service });
    console.log('Created Service');

    // 6. Create Deployment
    const deployment = createDeployment(ns, config);
    await appsApi.createNamespacedDeployment({ namespace: ns, body: deployment });
    console.log('Created Deployment');

    // 7. Create Route
    const route = createRoute(ns, config.agentName);
    await routeApi.createNamespacedCustomObject({
      group: 'route.openshift.io',
      version: 'v1',
      namespace: ns,
      plural: 'routes',
      body: route,
    });
    console.log('Created Route');

    // Get route URL
    const routeObj: any = await routeApi.getNamespacedCustomObject({
      group: 'route.openshift.io',
      version: 'v1',
      namespace: ns,
      plural: 'routes',
      name: 'openclaw',
    });
    const routeUrl = `https://${routeObj.body.spec.host}`;

    return {
      success: true,
      agentName: config.agentName,
      namespace: ns,
      routeUrl,
      gatewayToken,
    };
  } catch (error: any) {
    console.error('Deployment failed:', error);
    return {
      success: false,
      agentName: config.agentName,
      namespace: ns,
      error: error.message || 'Deployment failed',
    };
  }
}

/**
 * Get instance status
 */
export async function getInstanceStatus(
  name: string,
  namespace?: string,
): Promise<InstanceStatus | null> {
  const ns = namespace || namespaceName(name);

  try {
    // Check if deployment exists
    const deployment = await appsApi.readNamespacedDeployment({
      name: 'openclaw',
      namespace: ns,
    });

    // Get route URL
    let routeUrl: string | undefined;
    try {
      const route: any = await routeApi.getNamespacedCustomObject({
        group: 'route.openshift.io',
        version: 'v1',
        namespace: ns,
        plural: 'routes',
        name: 'openclaw',
      });
      routeUrl = `https://${route.body.spec.host}`;
    } catch {
      // Route might not exist yet
    }

    // Get gateway token from secret
    let gatewayToken: string | undefined;
    try {
      const secret = await coreApi.readNamespacedSecret({
        name: 'openclaw-secrets',
        namespace: ns,
      });
      if (secret.data?.['gateway-token']) {
        gatewayToken = Buffer.from(secret.data['gateway-token'], 'base64').toString('utf-8');
      }
    } catch {
      // Secret might not exist yet
    }

    const status: InstanceStatus = {
      name,
      namespace: ns,
      status: deployment.status?.availableReplicas ? 'Running' : 'Pending',
      routeUrl,
      gatewayToken,
      createdAt: deployment.metadata?.creationTimestamp?.toISOString(),
    };

    return status;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * List all OpenClaw instances
 */
export async function listInstances(): Promise<InstanceStatus[]> {
  try {
    const namespaces = await coreApi.listNamespace({
      labelSelector: 'app.kubernetes.io/managed-by=odh-openclaw',
    });

    const instances: InstanceStatus[] = [];

    for (const ns of namespaces.items) {
      const nsName = ns.metadata?.name;
      if (!nsName) continue;

      const agentName = ns.metadata?.labels?.['app.kubernetes.io/instance'];
      if (!agentName) continue;

      const status = await getInstanceStatus(agentName, nsName);
      if (status) {
        instances.push(status);
      }
    }

    return instances;
  } catch (error) {
    console.error('Failed to list instances:', error);
    return [];
  }
}

/**
 * Delete OpenClaw instance
 */
export async function deleteInstance(
  name: string,
  namespace?: string,
): Promise<{ success: boolean; error?: string }> {
  const ns = namespace || namespaceName(name);

  try {
    // Delete the namespace (cascades to all resources)
    await coreApi.deleteNamespace({ name: ns });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete instance',
    };
  }
}
