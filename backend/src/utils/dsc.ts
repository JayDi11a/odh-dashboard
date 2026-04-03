import {
  DataScienceClusterKind,
  DataScienceClusterKindStatus,
  DataScienceClusterList,
  KubeFastifyInstance,
} from '../types';
import { createCustomError } from './requestUtils';
import { DEV_MODE } from './constants';
import { getMockDscStatus } from '../routes/api/dsc/mock-status';

export const fetchClusterStatus = async (
  fastify: KubeFastifyInstance,
): Promise<DataScienceClusterKindStatus> => {
  const result: DataScienceClusterKind | null = await fastify.kube.customObjectsApi
    .listClusterCustomObject('datasciencecluster.opendatahub.io', 'v2', 'datascienceclusters')
    .then((res) => (res.body as DataScienceClusterList).items[0])
    .catch((e) => {
      fastify.log.error(`Failure to fetch dsc: ${e.response.body}`);
      return null;
    });

  if (!result) {
    // Use mock status in development mode if cluster doesn't have DSC resources
    // This allows local development without the OpenDataHub v2 operator
    if (DEV_MODE) {
      fastify.log.info('Using mock DSC status for ResourceWatcher (no operator installed)');
      return getMockDscStatus();
    }
    // May not be using v2 Operator
    throw createCustomError('DSC Unavailable', 'Unable to get status', 404);
  }

  return result.status;
};
