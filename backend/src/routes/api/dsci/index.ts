import { getClusterInitialization } from '../../../utils/dsci';
import { KubeFastifyInstance } from '../../../types';
import { getMockDsciStatus } from './mock-status';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async () => {
    try {
      return await getClusterInitialization(fastify);
    } catch (error) {
      // Use mock status if cluster doesn't have DSCI resources
      // This allows standalone deployments without the OpenDataHub v2 operator
      if (error.statusCode === 404) {
        fastify.log.info('Using mock DSCI status (no operator installed - standalone deployment)');
        return getMockDsciStatus();
      }
      throw error;
    }
  });
};
