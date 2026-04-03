# OpenClaw Management Module for ODH Dashboard

Deploy and manage [OpenClaw](https://github.com/openclaw) AI agent instances directly from the ODH Dashboard interface.

## Overview

The OpenClaw module extends ODH Dashboard with agent management capabilities, allowing users to:

- ✅ Deploy OpenClaw instances via a form-based UI
- ✅ Configure model providers (Anthropic, OpenAI, Vertex AI, vLLM)
- ✅ Manage instance lifecycle (create, view, delete)
- ✅ Monitor deployment status and access deployed agents

## Architecture

This module uses a **hybrid architecture** for rapid MVP development:

```
┌──────────────────────────────────┐
│  Frontend (React/PatternFly)     │
│  - Configuration Form            │
│  - Instance List                 │
│  - Status Display                │
└────────────┬─────────────────────┘
             │ HTTP/REST
┌────────────▼─────────────────────┐
│  Go BFF                          │
│  - /api/instances (CRUD)         │
│  - Auth & RBAC integration       │
└────────────┬─────────────────────┘
             │ HTTP (localhost:3100)
┌────────────▼─────────────────────┐
│  Node.js Deployer Service        │
│  - OpenShift deployment logic    │
│  - K8s resource creation         │
└────────────┬─────────────────────┘
             │ K8s API
┌────────────▼─────────────────────┐
│  OpenShift Cluster               │
│  - Namespace                     │
│  - ServiceAccount                │
│  - OAuth Proxy                   │
│  - Route                         │
│  - Deployment (OpenClaw)         │
└──────────────────────────────────┘
```

### Why Hybrid?

**Phase 1 (Current):** Hybrid Go BFF + Node.js deployer

- ✅ Rapid prototyping - reuses existing OpenClaw installer logic
- ✅ Proven deployment patterns
- ✅ Low risk

**Phase 2 (Future):** Pure Go implementation

- 🔄 Single runtime (no Node.js dependency)
- 🔄 Better performance
- 🔄 Easier deployment

## Project Structure

```
packages/openclaw/
├── frontend/                      # React UI (Module Federation remote)
│   ├── src/
│   │   ├── odh/extensions.ts     # Navigation & routing
│   │   └── app/                  # Application components (pending)
│   └── config/                   # Webpack Module Federation
├── bff/                          # Go Backend-for-Frontend
│   ├── cmd/                      # Entry point
│   ├── internal/
│   │   ├── api/                  # HTTP handlers
│   │   │   └── openclaw_handlers.go
│   │   └── integrations/
│   │       └── deployer/         # Deployer service client
│   │           └── client.go
│   └── api/openapi/              # OpenAPI spec (pending)
├── deployer-service/             # Node.js wrapper for OpenClaw installer
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── openshift-deployer.ts # Deployment logic
│   │   └── types.ts              # TypeScript types
│   └── package.json
├── Makefile                      # Development commands
├── CONTRIBUTION_GUIDE.md         # Upstream contribution guidance
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Node.js 22+ (for deployer service)
- Go 1.24+ (for BFF)
- Access to an OpenShift cluster
- `oc` CLI configured and logged in

### Installation

From the repository root:

```bash
# Install all dependencies
npm install

# Install deployer service dependencies
cd packages/openclaw/deployer-service
npm install
```

### Development Workflow

**Terminal 1: Start deployer service**

```bash
cd packages/openclaw/deployer-service
npm run dev
# Runs on http://localhost:3100
```

**Terminal 2: Start Go BFF**

```bash
cd packages/openclaw
make dev-bff
# Runs on http://localhost:4000
```

**Terminal 3: Start frontend**

```bash
cd packages/openclaw
make dev-frontend-federated
# Runs on http://localhost:9103
```

**Terminal 4: Start main ODH Dashboard** (from repo root)

```bash
# Backend
npm run dev:backend

# Frontend (separate terminal)
npm run dev:frontend
```

Now navigate to the ODH Dashboard and look for the "Agent Management" section in the sidebar.

## API Endpoints

### Deploy Instance

```bash
POST /api/instances
Content-Type: application/json

{
  "agentName": "my-agent",
  "modelProvider": "anthropic",
  "modelName": "claude-3-5-sonnet-20241022",
  "anthropicApiKey": "sk-ant-..."
}

Response:
{
  "success": true,
  "agentName": "my-agent",
  "namespace": "openclaw-my-agent",
  "routeUrl": "https://openclaw-my-agent.apps.cluster.example.com"
}
```

### List Instances

```bash
GET /api/instances

Response:
{
  "instances": [
    {
      "name": "my-agent",
      "namespace": "openclaw-my-agent",
      "status": "Running",
      "routeUrl": "https://...",
      "createdAt": "2026-03-27T..."
    }
  ]
}
```

### Get Instance

```bash
GET /api/instances/my-agent
```

### Delete Instance

```bash
DELETE /api/instances/my-agent
```

## Configuration

### Environment Variables

**BFF:**

- `DEPLOYER_SERVICE_URL` - Deployer service URL (default: `http://localhost:3100`)
- `PORT` - BFF port (default: `4000`)
- `AUTH_METHOD` - Auth method (`user_token`, `internal`, `disabled`)

**Deployer Service:**

- `PORT` - Service port (default: `3100`)
- `KUBECONFIG` - Path to kubeconfig (default: `~/.kube/config`)

### Feature Flag

Enable/disable the module in ODH Dashboard config:

```yaml
apiVersion: opendatahub.io/v1
kind: OdhDashboardConfig
metadata:
  name: odh-dashboard-config
spec:
  dashboardConfig:
    disableOpenclaw: false # false = enabled, true = disabled
```

## Model Providers

### Anthropic

```json
{
  "modelProvider": "anthropic",
  "modelName": "claude-3-5-sonnet-20241022",
  "anthropicApiKey": "sk-ant-..."
}
```

### OpenAI

```json
{
  "modelProvider": "openai",
  "modelName": "gpt-4",
  "openaiApiKey": "sk-..."
}
```

### Vertex AI (Google Cloud)

```json
{
  "modelProvider": "vertex",
  "modelName": "gemini-pro",
  "gcpServiceAccountJson": "{...}"
}
```

### vLLM (Self-hosted)

```json
{
  "modelProvider": "vllm",
  "modelName": "meta-llama/Llama-2-7b",
  "modelEndpoint": "http://vllm-service:8000"
}
```

## Contributing

See [CONTRIBUTION_GUIDE.md](./CONTRIBUTION_GUIDE.md) for detailed guidance on contributing this module to the upstream ODH Dashboard repository.

## Roadmap

### Phase 1: MVP (Current - Option A)

- ✅ Module scaffolding
- ✅ Deployer service (Node.js)
- ✅ BFF API endpoints
- ⏳ Configuration form UI
- ⏳ Instance list UI
- ⏳ Tests

### Phase 2: GA Features (Option B)

- 🔄 Pure Go deployer (eliminate Node.js)
- 🔄 Advanced configuration options
- 🔄 Instance monitoring/metrics
- 🔄 Batch operations

## License

Apache 2.0 (same as ODH Dashboard)

## Links

- **ODH Dashboard**: https://github.com/opendatahub-io/odh-dashboard
- **OpenClaw**: https://github.com/openclaw
- **OpenClaw Installer**: https://github.com/JayDi11a/openclaw-installer
