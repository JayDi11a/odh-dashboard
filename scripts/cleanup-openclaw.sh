#!/bin/bash

# cleanup-openclaw.sh
# Removes all traces of deployed OpenClaw to allow testing enable/disable workflow repeatedly

set -e

NAMESPACE="${1:-opendatahub}"
KEEP_IMAGE="${KEEP_IMAGE:-true}"  # Set to 'false' to delete imagestream (requires rebuilding image)

echo "=================================================="
echo "Cleaning up OpenClaw installation in namespace: $NAMESPACE"
echo "Image cleanup mode: $([ "$KEEP_IMAGE" = "true" ] && echo "KEEP (imagestream preserved)" || echo "FULL (imagestream will be deleted)")"
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

# Delete any additional OpenClaw resources (labeled - includes pods)
echo "Removing additional OpenClaw resources (pods, replicasets, etc.)..."
oc delete all -l app=openclaw -n "$NAMESPACE" --ignore-not-found=true
oc delete all -l app=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true
oc delete all -l app.kubernetes.io/managed-by=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true

# Wait a moment for pods to terminate gracefully
echo "Waiting for pods to terminate..."
sleep 5

# Delete OpenClaw PVC (WARNING: This deletes all OpenClaw data)
# Deleted after pods to avoid PVC hanging on terminating pods
echo "Removing OpenClaw PVC (all data will be lost)..."
oc delete pvc openclaw-home-pvc -n "$NAMESPACE" --ignore-not-found=true

# Delete installer Jobs
echo "Removing installer Jobs..."
oc delete jobs -l job-name=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true
oc delete jobs -l app=openclaw-installer -n "$NAMESPACE" --ignore-not-found=true

# Delete OpenClaw ConfigMaps and Secrets
echo "Removing OpenClaw ConfigMaps and Secrets..."
oc delete configmap openclaw-config -n "$NAMESPACE" --ignore-not-found=true
oc delete configmap openclaw-agent -n "$NAMESPACE" --ignore-not-found=true
oc delete secret openclaw-secrets -n "$NAMESPACE" --ignore-not-found=true

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

# Delete BuildConfigs from failed in-cluster build attempts
echo "Removing OpenClaw BuildConfigs..."
oc delete buildconfig openclaw-module-build -n "$NAMESPACE" --ignore-not-found=true
oc delete buildconfig openclaw-module-build-ubi -n "$NAMESPACE" --ignore-not-found=true

# Delete failed builds
echo "Removing failed builds..."
oc delete builds -l buildconfig=openclaw-module-build -n "$NAMESPACE" --ignore-not-found=true
oc delete builds -l buildconfig=openclaw-module-build-ubi -n "$NAMESPACE" --ignore-not-found=true

# Delete image transfer PVC (from local image upload process)
echo "Removing image transfer PVC..."
oc delete pvc openclaw-image-transfer -n "$NAMESPACE" --ignore-not-found=true

# Delete privileged service account used for image loading
echo "Removing privileged service account..."
oc delete sa image-loader-sa -n "$NAMESPACE" --ignore-not-found=true

# Conditionally delete ImageStream based on KEEP_IMAGE setting
if [ "$KEEP_IMAGE" = "false" ]; then
  echo "⚠️  Deleting OpenClaw ImageStream (image will need to be rebuilt)..."
  oc delete imagestream openclaw-module -n "$NAMESPACE" --ignore-not-found=true
  echo "  ⚠️  WARNING: You will need to rebuild and push the openclaw-module image"
  echo "  ⚠️  See /Users/geraldtrotman/Virtualenvs/openclaw-npm/Dockerfile for rebuild instructions"
else
  echo "✓ Keeping OpenClaw ImageStream (contains locally-built image)"
  echo "  ImageStream: openclaw-module"
  IMAGE_SHA=$(oc get imagestream openclaw-module -n "$NAMESPACE" -o jsonpath='{.status.tags[?(@.tag=="latest")].items[0].dockerImageReference}' 2>/dev/null || echo "Not found")
  echo "  Latest image: $IMAGE_SHA"
fi

# Restart dashboard pod to clear cached application state
echo "Restarting dashboard pod to refresh application state..."
oc delete pod -n "$NAMESPACE" -l app=odh-dashboard --ignore-not-found=true

echo "=================================================="
echo "OpenClaw cleanup complete!"
echo "OpenClaw should now show 'Enable' button in dashboard"
if [ "$KEEP_IMAGE" = "true" ]; then
  echo "✓ ImageStream preserved - deployments will use locally-built image"
else
  echo "⚠️  ImageStream deleted - image must be rebuilt before next deployment"
fi
echo ""
echo "⚠️  Note: If you had DEV_MODE or oauth-proxy bypass configured,"
echo "   you'll need to reapply after re-enabling OpenClaw:"
echo "   oc set env deployment/openclaw DEV_MODE=true -n opendatahub"
echo "   Then patch oauth-proxy args to use --skip-auth-regex=.*"
echo "=================================================="
