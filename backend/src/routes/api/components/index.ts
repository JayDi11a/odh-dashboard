import { FastifyReply, FastifyRequest } from 'fastify';
import { listComponents, removeComponent } from './list';
import { KubeFastifyInstance } from '../../../types';
import { secureRoute, secureAdminRoute } from '../../../utils/route-security';

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/',
    secureRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) => {
      // Prevent browser caching of component state
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');

      return listComponents(fastify, request)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        });
    }),
  );

  fastify.get(
    '/remove',
    secureAdminRoute(fastify)(async (request: FastifyRequest, reply: FastifyReply) =>
      removeComponent(fastify, request)
        .then((res) => res)
        .catch((res) => {
          reply.send(res);
        }),
    ),
  );
};
