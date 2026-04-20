# OpenClaw Installer Integration for ODH Dashboard

This directory contains the OpenClaw installer integration for the ODH Dashboard Enable workflow.

## Overview

The OpenClaw installer uses the official [`openclaw-installer`](https://github.com/JayDi11a/openclaw-installer) project modules to deploy OpenClaw to OpenShift.

## Components

| File | Purpose |
|------|---------|
| `install-openclaw.mjs` | Node.js script using openclaw-installer deployer modules |
| `Dockerfile.installer` | Container image for the installer script |
| `openclaw-installer-cronjob.yaml` | CronJob manifest (suspended, manually triggered) |

## Build and Deploy

### 1. Build the Installer Image

```bash
cd manifests/openclaw

# Build for AMD64 architecture (cluster compatibility)
podman build --platform linux/amd64 -t openclaw-installer:latest -f Dockerfile.installer .

# Get the external registry route
REGISTRY_ROUTE=$(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}')

# Login to the registry
podman login -u $(oc whoami) -p $(oc whoami -t) $REGISTRY_ROUTE

# Tag for cluster registry
podman tag openclaw-installer:latest $REGISTRY_ROUTE/opendatahub/openclaw-installer:latest

# Push to cluster registry
podman push $REGISTRY_ROUTE/opendatahub/openclaw-installer:latest
```

### 2. Deploy the CronJob

```bash
# Deploy the CronJob, ServiceAccount, Role, and RoleBinding
oc apply -f openclaw-installer-cronjob.yaml

# Verify it's created
oc get cronjob openclaw-installer -n opendatahub
```

## How It Works

1. **Initial State**: OpenClaw shows "Enable" button in ODH Dashboard
2. **User clicks Enable**: Dashboard creates `openclaw-enable-secret` with API keys
3. **Dashboard triggers installer**: Creates a Job from the CronJob template
4. **Installer runs**: Deploys OpenClaw using openclaw-installer modules
5. **Validation**: Creates `openclaw-enable-validation-result` ConfigMap
6. **Dashboard updates**: Shows "Open application" link

## Testing the Enable/Disable Workflow

To test the workflow repeatedly:

```bash
# Clean up OpenClaw (resets to "Enable" button state)
cd /Users/geraldtrotman/Virtualenvs/odh-dashboard
./scripts/cleanup-openclaw.sh

# Now click Enable in the dashboard to test the installation
```

## Cleanup Script

The cleanup script removes ALL OpenClaw resources:

- OpenClaw Deployment, Service, Route
- OpenClaw ConfigMaps and Secrets
- OpenClaw PersistentVolumeClaim (⚠️ all data is deleted)
- Installer Jobs
- Validation ConfigMap (causes OpenClaw to show "Enable" again)
- Enable Secret

**Usage:**

```bash
./scripts/cleanup-openclaw.sh [namespace]

# Example:
./scripts/cleanup-openclaw.sh opendatahub
```

## Updating the Installer

To update the openclaw-installer version:

1. Update the npm install line in `Dockerfile.installer`:
   ```dockerfile
   RUN npm install --global @openclaw/installer@<new-version>
   ```

2. Rebuild and push the image (see step 1 above)

3. Restart the CronJob:
   ```bash
   oc delete cronjob openclaw-installer -n opendatahub
   oc apply -f openclaw-installer-cronjob.yaml
   ```

## Troubleshooting

### Check installer Job logs

```bash
# Find the installer Job
oc get jobs -n opendatahub | grep openclaw-installer

# View logs
oc logs -n opendatahub job/openclaw-installer-job-custom-run
```

### Check CronJob status

```bash
oc describe cronjob openclaw-installer -n opendatahub
```

### Manually trigger installer

```bash
# Create a test Job from the CronJob
oc create job --from=cronjob/openclaw-installer test-install -n opendatahub

# Watch the Job
oc get jobs -n opendatahub -w

# View logs
oc logs -n opendatahub job/test-install -f
```

### Check OpenClaw deployment

```bash
# After installation completes
oc get deployment openclaw -n opendatahub
oc get route openclaw -n opendatahub
oc get pvc openclaw-home-pvc -n opendatahub
```

## Architecture

### Container Image

The installer image is based on Node.js 22 Alpine and includes:
- `@openclaw/installer` package from GitHub
- `@kubernetes/client-node` for Kubernetes API access
- `install-openclaw.mjs` script that programmatically uses the deployer modules

### CronJob Configuration

- **Suspended by default**: The CronJob is created with `suspend: true`
- **Manual triggering**: The ODH Dashboard backend creates a Job from this CronJob when Enable is clicked
- **ServiceAccount**: Has permissions to create OpenClaw resources in the namespace
- **Environment variables**: API keys injected from `openclaw-enable-secret`

### Security

- Installer runs with minimal RBAC permissions (only opendatahub namespace)
- API keys are stored in Kubernetes Secret (created by dashboard)
- Secret keys are injected as environment variables, not mounted files
- ServiceAccount is scoped to only the necessary resources

## Integration with ODH Dashboard

The ODH Dashboard backend (`validateISV.ts`) handles the Enable workflow:

1. User clicks Enable
2. Dashboard creates `openclaw-enable-secret` with form values
3. Dashboard triggers CronJob by creating a Job
4. Job runs installer script
5. Installer deploys OpenClaw and creates validation ConfigMap
6. Dashboard polls for validation ConfigMap
7. When found, OpenClaw is marked as enabled

See `backend/src/routes/api/validate-isv/validateISV.ts` for the integration code.
