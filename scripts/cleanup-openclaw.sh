#!/bin/bash

# cleanup-openclaw.sh
# Removes all traces of deployed OpenClaw to allow testing enable/disable workflow repeatedly

set -e

NAMESPACE="${1:-opendatahub}"

echo "=================================================="
echo "Cleaning up OpenClaw installation in namespace: $NAMESPACE"
echo "=================================================="

# Delete OpenClaw Installer UI resources (created by installer CronJob)
echo "Removing OpenClaw Installer UI resources..."
oc delete deployment openclaw-installer -n "$NAMESPACE" --ignore-not-found=true
oc delete service openclaw-installer -n "$NAMESPACE" --ignore-not-found=true
oc delete route openclaw-installer -n "$NAMESPACE" --ignore-not-found=true

# Delete OpenClaw deployment resources
echo "Removing OpenClaw deployment resources..."
oc delete deployment openclaw -n "$NAMESPACE" --ignore-not-found=true
oc delete service openclaw -n "$NAMESPACE" --ignore-not-found=true
oc delete route openclaw -n "$NAMESPACE" --ignore-not-found=true

# Delete OpenClaw ConfigMaps and Secrets
echo "Removing OpenClaw ConfigMaps and Secrets..."
oc delete configmap openclaw-config -n "$NAMESPACE" --ignore-not-found=true
oc delete configmap openclaw-agent -n "$NAMESPACE" --ignore-not-found=true
oc delete secret openclaw-secrets -n "$NAMESPACE" --ignore-not-found=true

# Delete OpenClaw PVC (WARNING: This deletes all OpenClaw data)
echo "Removing OpenClaw PVC (all data will be lost)..."
oc delete pvc openclaw-home-pvc -n "$NAMESPACE" --ignore-not-found=true

# Delete installer Jobs
echo "Removing installer Jobs..."
oc delete jobs -l job-name=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true
oc delete jobs -l app=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true

# Delete validation ConfigMap (this makes OpenClaw show "Enable" button again)
echo "Removing validation ConfigMap..."
oc delete configmap openclaw-enable-validation-result -n "$NAMESPACE" --ignore-not-found=true

# Delete enable Secret
echo "Removing enable Secret..."
oc delete secret openclaw-enable-secret -n "$NAMESPACE" --ignore-not-found=true

# Remove openclaw entry from enabled applications ConfigMap
echo "Removing openclaw from enabled applications ConfigMap..."
oc patch configmap odh-enabled-applications-config -n "$NAMESPACE" --type='json' \
  -p='[{"op": "remove", "path": "/data/openclaw"}]' 2>/dev/null || \
  echo "  (ConfigMap entry already removed or doesn't exist)"

# Delete any additional OpenClaw resources (labeled)
echo "Removing additional OpenClaw resources..."
oc delete all -l app=openclaw -n "$NAMESPACE" --ignore-not-found=true
oc delete all -l app=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true
oc delete all -l app.kubernetes.io/managed-by=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true

# Restart dashboard pod to clear cached application state
echo "Restarting dashboard pod to refresh application state..."
oc delete pod -n "$NAMESPACE" -l app=odh-dashboard --ignore-not-found=true

echo "=================================================="
echo "OpenClaw cleanup complete!"
echo "OpenClaw should now show 'Enable' button in dashboard"
echo "=================================================="
