#!/usr/bin/env node
/**
 * install-openclaw.mjs
 * Programmatic OpenClaw deployment using openclaw-installer modules
 */

import { deployKubernetes } from './openclaw-installer/server/deployers/kubernetes.js';
import * as k8s from '@kubernetes/client-node';

const CONFIG_MAP_NAME = 'openclaw-enable-validation-result';
const NAMESPACE = process.env.NAMESPACE || 'opendatahub';

async function createValidationConfigMap() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: CONFIG_MAP_NAME,
      namespace: NAMESPACE,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    data: {
      validation_result: 'true',
    },
  };

  try {
    await coreV1Api.createNamespacedConfigMap(NAMESPACE, configMap);
    console.log(`Created validation ConfigMap: ${CONFIG_MAP_NAME}`);
  } catch (error) {
    if (error.response?.statusCode === 409) {
      // Already exists, replace it
      await coreV1Api.replaceNamespacedConfigMap(CONFIG_MAP_NAME, NAMESPACE, configMap);
      console.log(`Updated validation ConfigMap: ${CONFIG_MAP_NAME}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('================================================');
  console.log('OpenClaw Installer (ODH Dashboard Integration)');
  console.log('================================================');
  console.log(`Namespace: ${NAMESPACE}`);
  console.log('');

  // Deploy configuration
  const deployConfig = {
    agentName: 'default-agent',
    agentDisplayName: 'OpenClaw Agent',
    namespace: NAMESPACE,
    image: process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:latest',
    provider: 'anthropic',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || '',
    modelEndpoint: process.env.MODEL_ENDPOINT || '',
  };

  console.log('Deploying OpenClaw...');
  try {
    await deployKubernetes(deployConfig);
    console.log('OpenClaw deployed successfully!');
  } catch (error) {
    console.error('Failed to deploy OpenClaw:', error.message);
    process.exit(1);
  }

  console.log('');
  console.log('Creating validation ConfigMap...');
  try {
    await createValidationConfigMap();
  } catch (error) {
    console.error('Failed to create validation ConfigMap:', error.message);
    process.exit(1);
  }

  console.log('');
  console.log('================================================');
  console.log('Installation completed successfully!');
  console.log('================================================');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
