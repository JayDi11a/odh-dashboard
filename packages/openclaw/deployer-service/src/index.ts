/**
 * OpenClaw Deployer Service
 *
 * Node.js HTTP service that wraps the OpenClaw installer's OpenShift deployer
 * Provides REST API for the Go BFF to call
 */

import express from 'express';
import cors from 'cors';
import {
  deployInstance,
  getInstanceStatus,
  listInstances,
  deleteInstance,
} from './openshift-deployer.js';
import type { DeploymentConfig } from './types.js';

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'openclaw-deployer' });
});

/**
 * POST /deploy
 * Deploy a new OpenClaw instance
 */
app.post('/deploy', async (req, res) => {
  try {
    const config: DeploymentConfig = req.body;

    // Validate required fields
    if (!config.agentName) {
      return res.status(400).json({
        success: false,
        error: 'agentName is required',
      });
    }

    if (!config.modelProvider || !config.modelName) {
      return res.status(400).json({
        success: false,
        error: 'modelProvider and modelName are required',
      });
    }

    // Validate credentials based on provider
    if (config.modelProvider === 'anthropic' && !config.anthropicApiKey) {
      return res.status(400).json({
        success: false,
        error: 'anthropicApiKey is required for Anthropic provider',
      });
    }

    if (config.modelProvider === 'openai' && !config.openaiApiKey) {
      return res.status(400).json({
        success: false,
        error: 'openaiApiKey is required for OpenAI provider',
      });
    }

    if (config.modelProvider === 'vertex' && !config.gcpServiceAccountJson) {
      return res.status(400).json({
        success: false,
        error: 'gcpServiceAccountJson is required for Vertex AI provider',
      });
    }

    console.log(`Deploying OpenClaw instance: ${config.agentName}`);
    const result = await deployInstance(config);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /instances
 * List all OpenClaw instances
 */
app.get('/instances', async (req, res) => {
  try {
    const instances = await listInstances();
    res.json({ instances });
  } catch (error: any) {
    console.error('List instances error:', error);
    res.status(500).json({
      error: error.message || 'Failed to list instances',
    });
  }
});

/**
 * GET /instances/:name
 * Get status of a specific instance
 */
app.get('/instances/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { namespace } = req.query;

    const status = await getInstanceStatus(name, namespace as string | undefined);

    if (status) {
      res.json(status);
    } else {
      res.status(404).json({
        error: `Instance ${name} not found`,
      });
    }
  } catch (error: any) {
    console.error('Get instance error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get instance status',
    });
  }
});

/**
 * DELETE /instances/:name
 * Delete an OpenClaw instance
 */
app.delete('/instances/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { namespace } = req.query;

    console.log(`Deleting OpenClaw instance: ${name}`);
    const result = await deleteInstance(name, namespace as string | undefined);

    if (result.success) {
      res.json({ success: true, message: `Instance ${name} deleted` });
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Delete instance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete instance',
    });
  }
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`OpenClaw Deployer Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
