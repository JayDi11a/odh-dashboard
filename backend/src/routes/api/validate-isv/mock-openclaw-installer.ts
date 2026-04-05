import { V1ConfigMap, V1Job, BatchV1Api } from '@kubernetes/client-node';
import { KubeFastifyInstance } from '../../../types';

/**
 * Mock OpenClaw installer job for local development
 * Simulates the job that would run kubectl apply -k on the openclaw-installer repo
 */
export const createMockOpenclawInstallerJob = async (
  fastify: KubeFastifyInstance,
  jobName: string,
  namespace: string,
): Promise<void> => {
  const batchV1Api: BatchV1Api = fastify.kube.batchV1Api;

  const mockJob: V1Job = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName,
      namespace,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    spec: {
      template: {
        spec: {
          restartPolicy: 'Never',
          containers: [
            {
              name: 'installer',
              image: 'quay.io/openshift/origin-cli:latest',
              command: ['echo', 'Mock OpenClaw installation completed'],
            },
          ],
        },
      },
    },
    status: {
      succeeded: 1,
      completionTime: new Date(),
      startTime: new Date(Date.now() - 5000),
    },
  };

  try {
    await batchV1Api.createNamespacedJob(namespace, mockJob);
    fastify.log.info(`Mock OpenClaw installer job created: ${jobName}`);
  } catch (e) {
    fastify.log.error(`Failed to create mock job: ${e.message}`);
  }
};

/**
 * Mock validation ConfigMap for OpenClaw installation
 * Created by the installer job to signal successful installation
 */
export const createMockOpenclawValidationConfigMap = async (
  fastify: KubeFastifyInstance,
  namespace: string,
): Promise<void> => {
  const coreV1Api = fastify.kube.coreV1Api;

  const mockConfigMap: V1ConfigMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'openclaw-enable-validation-result',
      namespace,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    data: {
      validation_result: 'true',
    },
  };

  try {
    await coreV1Api.createNamespacedConfigMap(namespace, mockConfigMap);
    fastify.log.info('Mock OpenClaw validation ConfigMap created');
  } catch (e) {
    if (e.response?.statusCode === 409) {
      // ConfigMap already exists
      fastify.log.info('Mock OpenClaw validation ConfigMap already exists');
    } else {
      fastify.log.error(`Failed to create mock ConfigMap: ${e.message}`);
    }
  }
};
