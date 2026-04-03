import { getClusterInitialization } from '../../../utils/dsci';
import { KubeFastifyInstance } from '../../../types';
import { getMockDsciStatus } from './mock-status';
import { DEV_MODE } from '../../../utils/constants';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async () => {
    try {
      return await getClusterInitialization(fastify);
    } catch (error) {
      // Use mock status in development mode if cluster doesn't have DSCI resources
      // This allows local development without the OpenDataHub v2 operator
      if (DEV_MODE && error.statusCode === 404) {
        fastify.log.info('Using mock DSCI status for local development (no operator installed)');
        return getMockDsciStatus();
      }
      throw error;
    }
  });
};
