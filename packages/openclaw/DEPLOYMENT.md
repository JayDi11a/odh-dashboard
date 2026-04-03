# OpenClaw Module - Deployment Guide

This guide covers deploying the OpenClaw management module to a real ODH cluster.

## Prerequisites

### Required Tools

- `oc` CLI configured and logged into your OpenShift cluster
- `kubectl` (optional, if you prefer kubectl over oc)
- Node.js 22+ (for deployer service)
- Go 1.24+ (for BFF)
- Access to an OpenShift cluster with ODH installed

### Required Permissions

The user deploying this module needs:

- Cluster-admin or namespace-admin permissions (for creating namespaces, service accounts, routes)
- Ability to create Secrets (for API keys)
- Ability to create Deployments and Services

### Verify ODH Installation

```bash
# Check if ODH is installed
oc get csv -n opendatahub | grep opendatahub

# Check ODH Dashboard deployment
oc get deployment odh-dashboard -n opendatahub
```

## Local Development Against ODH Cluster

### Option 1: Full Local Development (Recommended for Testing)

Run all three services locally while connected to the cluster:

**Terminal 1: Start Deployer Service**

```bash
cd packages/openclaw/deployer-service
npm install
npm run dev
# Runs on http://localhost:3100
```

**Terminal 2: Start Go BFF**

```bash
cd packages/openclaw/bff
# BFF will use your local kubeconfig to connect to the cluster
make run PORT=4000 MOCK_K8S_CLIENT=false AUTH_METHOD=user_token
# Runs on http://localhost:4000
```

**Terminal 3: Start Frontend (Module Federation Remote)**

```bash
cd packages/openclaw/frontend
npm install
PORT=9103 npm run start:dev
# Runs on http://localhost:9103
```

**Terminal 4: Start Main ODH Dashboard**

```bash
# From repo root
npm run dev:backend  # Backend on http://localhost:8080
# In another terminal
npm run dev:frontend # Frontend on http://localhost:3000
```

Now navigate to `http://localhost:3000` and look for "Agent Management" → "OpenClaw Instances" in the sidebar.

### Option 2: Federated Mode (Using Makefile)

From the openclaw package directory:

```bash
cd packages/openclaw
make dev-start-federated
```

This starts:

- Deployer service on port 3100
- BFF on port 4000 (connected to real cluster)
- Frontend on port 9103

Then start the main dashboard from the repo root.

## Deploying to ODH Cluster

### Step 1: Build Container Images

Build the OpenClaw module container (BFF + frontend):

```bash
cd packages/openclaw

# Build for OpenShift
docker build -t quay.io/<your-org>/openclaw-module:latest \
  -f Dockerfile.workspace \
  --build-arg DEPLOYMENT_MODE=federated \
  --build-arg STYLE_THEME=patternfly \
  .

# Push to your registry
docker push quay.io/<your-org>/openclaw-module:latest
```

### Step 2: Deploy Deployer Service

The deployer service needs to run as a separate deployment in the cluster:

**Create deployer-service deployment:**

```yaml
# deployer-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openclaw-deployer
  namespace: opendatahub
spec:
  replicas: 1
  selector:
    matchLabels:
      app: openclaw-deployer
  template:
    metadata:
      labels:
        app: openclaw-deployer
    spec:
      serviceAccountName: openclaw-deployer-sa
      containers:
        - name: deployer
          image: quay.io/<your-org>/openclaw-deployer:latest
          ports:
            - containerPort: 3100
              name: http
              protocol: TCP
          env:
            - name: PORT
              value: '3100'
            - name: NODE_ENV
              value: production
---
apiVersion: v1
kind: Service
metadata:
  name: openclaw-deployer
  namespace: opendatahub
spec:
  selector:
    app: openclaw-deployer
  ports:
    - protocol: TCP
      port: 3100
      targetPort: 3100
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: openclaw-deployer-sa
  namespace: opendatahub
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: openclaw-deployer-role
rules:
  - apiGroups: ['']
    resources: ['namespaces', 'serviceaccounts', 'secrets', 'services']
    verbs: ['create', 'get', 'list', 'delete', 'update', 'patch']
  - apiGroups: ['apps']
    resources: ['deployments']
    verbs: ['create', 'get', 'list', 'delete', 'update', 'patch']
  - apiGroups: ['route.openshift.io']
    resources: ['routes']
    verbs: ['create', 'get', 'list', 'delete', 'update', 'patch']
  - apiGroups: ['']
    resources: ['pods']
    verbs: ['get', 'list']
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: openclaw-deployer-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: openclaw-deployer-role
subjects:
  - kind: ServiceAccount
    name: openclaw-deployer-sa
    namespace: opendatahub
```

Apply the deployer deployment:

```bash
oc apply -f deployer-deployment.yaml
```

### Step 3: Update ODH Dashboard ConfigMap

Add the OpenClaw module to the Module Federation configuration:

```bash
# Edit the federation ConfigMap
oc edit configmap odh-dashboard-federation-config -n opendatahub
```

Add this entry to the `remotes` array in the ConfigMap data:

```json
{
  "name": "openclaw",
  "remoteEntry": "/remoteEntry.js",
  "authorize": true,
  "tls": true,
  "proxy": [
    {
      "path": "/openclaw/api",
      "pathRewrite": "/api"
    }
  ],
  "service": {
    "name": "openclaw-module",
    "port": 8843
  }
}
```

### Step 4: Deploy OpenClaw Module

Create deployment for the OpenClaw module (BFF + frontend):

```yaml
# openclaw-module-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openclaw-module
  namespace: opendatahub
spec:
  replicas: 1
  selector:
    matchLabels:
      app: openclaw-module
  template:
    metadata:
      labels:
        app: openclaw-module
    spec:
      serviceAccountName: odh-dashboard
      containers:
        - name: bff
          image: quay.io/<your-org>/openclaw-module:latest
          ports:
            - containerPort: 8843
              name: https
              protocol: TCP
          env:
            - name: PORT
              value: '8843'
            - name: AUTH_METHOD
              value: 'user_token'
            - name: AUTH_TOKEN_HEADER
              value: 'x-forwarded-access-token'
            - name: DEPLOYER_SERVICE_URL
              value: 'http://openclaw-deployer.opendatahub.svc.cluster.local:3100'
            - name: STATIC_ASSETS_DIR
              value: '/app/static'
---
apiVersion: v1
kind: Service
metadata:
  name: openclaw-module
  namespace: opendatahub
spec:
  selector:
    app: openclaw-module
  ports:
    - protocol: TCP
      port: 8843
      targetPort: 8843
```

Apply the module deployment:

```bash
oc apply -f openclaw-module-deployment.yaml
```

### Step 5: Enable Feature Flag

Update the ODH Dashboard config to enable OpenClaw:

```bash
# Edit the dashboard config
oc edit odhdashboardconfig odh-dashboard-config -n opendatahub
```

Set `disableOpenclaw: false` in the spec:

```yaml
spec:
  dashboardConfig:
    disableOpenclaw: false
```

### Step 6: Restart ODH Dashboard

```bash
# Restart the dashboard to pick up the new module
oc rollout restart deployment/odh-dashboard -n opendatahub

# Wait for the rollout to complete
oc rollout status deployment/odh-dashboard -n opendatahub
```

### Step 7: Access the Module

1. Navigate to your ODH Dashboard URL (e.g., `https://odh-dashboard-opendatahub.apps.your-cluster.com`)
2. Log in with your OpenShift credentials
3. Look for "Agent Management" in the sidebar navigation
4. Click "OpenClaw Instances" to access the module

## Testing the Deployment

### Deploy a Test Instance

1. Click "Deploy new instance" button
2. Fill in the form:
   - **Agent Name**: `test-agent`
   - **Model Provider**: Select `Anthropic`
   - **Model Name**: `claude-3-5-sonnet-20241022`
   - **Anthropic API Key**: Your API key
3. Click "Deploy"

### Verify Deployment

```bash
# Check if the OpenClaw namespace was created
oc get namespace openclaw-test-agent

# Check the deployment
oc get deployment -n openclaw-test-agent

# Check the route
oc get route -n openclaw-test-agent

# Get the Route URL
oc get route openclaw -n openclaw-test-agent -o jsonpath='{.spec.host}'
```

### Access the OpenClaw Instance

The deployed instance will have a Route URL shown in the instance list. Click it to access the OpenClaw UI.

## Troubleshooting

### Deployer Service Issues

```bash
# Check deployer logs
oc logs deployment/openclaw-deployer -n opendatahub

# Check if deployer can access Kubernetes API
oc exec -it deployment/openclaw-deployer -n opendatahub -- curl -k https://kubernetes.default.svc/api/v1/namespaces
```

### BFF Issues

```bash
# Check BFF logs
oc logs deployment/openclaw-module -n opendatahub

# Check if BFF can reach deployer service
oc exec -it deployment/openclaw-module -n opendatahub -- curl http://openclaw-deployer.opendatahub.svc.cluster.local:3100/health
```

### Module Federation Issues

```bash
# Check if the module is loading
# Look for "openclaw" in the browser console network tab

# Verify the federation ConfigMap
oc get configmap odh-dashboard-federation-config -n opendatahub -o yaml

# Check dashboard logs for module loading errors
oc logs deployment/odh-dashboard -n opendatahub
```

### Deployment Failures

If an OpenClaw instance deployment fails:

```bash
# Check deployer logs for errors
oc logs deployment/openclaw-deployer -n opendatahub --tail=50

# Check if the namespace was created
oc get namespace openclaw-<agent-name>

# If namespace exists, check deployment status
oc get all -n openclaw-<agent-name>

# Check events for errors
oc get events -n openclaw-<agent-name> --sort-by='.lastTimestamp'
```

## Uninstalling

To remove the OpenClaw module:

```bash
# Delete OpenClaw module deployment
oc delete deployment openclaw-module -n opendatahub
oc delete service openclaw-module -n opendatahub

# Delete deployer service
oc delete deployment openclaw-deployer -n opendatahub
oc delete service openclaw-deployer -n opendatahub
oc delete serviceaccount openclaw-deployer-sa -n opendatahub
oc delete clusterrolebinding openclaw-deployer-binding
oc delete clusterrole openclaw-deployer-role

# Delete deployed OpenClaw instances
# List all openclaw namespaces
oc get namespaces | grep openclaw-

# Delete each instance namespace
oc delete namespace openclaw-<instance-name>

# Remove from federation config
oc edit configmap odh-dashboard-federation-config -n opendatahub
# Remove the openclaw entry

# Disable feature flag
oc edit odhdashboardconfig odh-dashboard-config -n opendatahub
# Set disableOpenclaw: true

# Restart dashboard
oc rollout restart deployment/odh-dashboard -n opendatahub
```

## Next Steps

- See [README.md](./README.md) for API documentation
- See [CONTRIBUTION_GUIDE.md](./CONTRIBUTION_GUIDE.md) for contributing this to upstream ODH
- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for current status and roadmap
