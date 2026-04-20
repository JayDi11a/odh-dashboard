import * as k8s from "@kubernetes/client-node";
import { loadKubeConfig } from "../../../src/server/services/k8s.js";
const K8S_PROBE_TIMEOUT_MS = 2000;
async function withTimeout(promise, timeoutMs = K8S_PROBE_TIMEOUT_MS) {
    return await Promise.race([
        promise,
        new Promise((_, reject) => {
            globalThis.setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
}
/**
 * Check whether the cluster has the route.openshift.io API group,
 * indicating it's an OpenShift cluster.
 */
export async function isOpenShift() {
    try {
        const client = loadKubeConfig().makeApiClient(k8s.ApisApi);
        const result = await withTimeout(client.getAPIVersions());
        const groups = result.groups || [];
        return groups.some((g) => g.name === "route.openshift.io");
    }
    catch {
        return false;
    }
}
