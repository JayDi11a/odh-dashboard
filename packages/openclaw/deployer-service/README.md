# OpenClaw Deployer Service

Node.js HTTP service that wraps the OpenClaw installer's OpenShift deployer logic.

## Overview

This service provides a REST API for deploying and managing OpenClaw instances on OpenShift clusters. It's called by the Go BFF in the ODH Dashboard.

## Architecture

```
Go BFF → HTTP (localhost:3100) → Node.js Deployer Service → K8s API
```

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "openclaw-deployer"
}
```

### Deploy Instance
```bash
POST /deploy
Content-Type: application/json

{
  "agentName": "my-agent",
  "modelProvider": "anthropic",
  "modelName": "claude-3-5-sonnet-20241022",
  "anthropicApiKey": "sk-ant-..."
}
```

Response:
```json
{
  "success": true,
  "agentName": "my-agent",
  "namespace": "openclaw-my-agent",
  "routeUrl": "https://openclaw-openclaw-my-agent.apps.cluster.example.com"
}
```

### List Instances
```bash
GET /instances
```

Response:
```json
{
  "instances": [
    {
      "name": "my-agent",
      "namespace": "openclaw-my-agent",
      "status": "Running",
      "routeUrl": "https://openclaw-openclaw-my-agent.apps.cluster.example.com",
      "createdAt": "2026-03-26T21:30:00Z"
    }
  ]
}
```

### Get Instance Status
```bash
GET /instances/:name
```

Response:
```json
{
  "name": "my-agent",
  "namespace": "openclaw-my-agent",
  "status": "Running",
  "routeUrl": "https://openclaw-openclaw-my-agent.apps.cluster.example.com",
  "createdAt": "2026-03-26T21:30:00Z"
}
```

### Delete Instance
```bash
DELETE /instances/:name
```

Response:
```json
{
  "success": true,
  "message": "Instance my-agent deleted"
}
```

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3100` | HTTP server port |
| `KUBECONFIG` | `~/.kube/config` | Path to kubeconfig file |

## Kubernetes Resources Created

For each OpenClaw instance, the deployer creates:

1. **Namespace**: `openclaw-<agent-name>`
2. **ServiceAccount**: `openclaw-oauth-proxy` (with OAuth annotations)
3. **Secrets**:
   - `openclaw-oauth-config` (OAuth cookie secret)
   - `openclaw-secrets` (API keys, credentials)
4. **Deployment**: `openclaw` (with OAuth proxy sidecar)
5. **Service**: `openclaw` (ClusterIP with OAuth UI port)
6. **Route**: `openclaw` (TLS edge-terminated)

## Future: Migration to Pure Go

This service is **Phase 1** (Option A) - a rapid prototype to validate the concept.

**Phase 2** (Option B) will rewrite this logic in Go and embed it directly in the BFF, eliminating the Node.js runtime dependency.
