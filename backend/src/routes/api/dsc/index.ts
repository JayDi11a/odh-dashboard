import { KubeFastifyInstance } from '../../../types';
import { getClusterStatus } from '../../../utils/resourceUtils';
import { getMockDscStatus } from './mock-status';
import { DEV_MODE } from '../../../utils/constants';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async () => {
    const clusterStatus = getClusterStatus(fastify);

    // Use mock status in development mode if cluster doesn't have DSC resources
    // This allows local development without the OpenDataHub v2 operator
    if (DEV_MODE && (!clusterStatus || Object.keys(clusterStatus).length === 0)) {
      fastify.log.info('Using mock DSC status for local development (no operator installed)');
      return getMockDscStatus();
    }

    return clusterStatus;
  });
};
