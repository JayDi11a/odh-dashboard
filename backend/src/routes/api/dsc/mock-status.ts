import { DataScienceClusterKindStatus } from '../../../types';

export const getMockDscStatus = (): DataScienceClusterKindStatus => ({
  phase: 'Ready',
  conditions: [
    {
      type: 'Ready',
      status: 'True',
      reason: 'ReconcileCompleted',
      message: 'Mock DSC for local development',
      lastTransitionTime: new Date().toISOString(),
      lastHeartbeatTime: new Date().toISOString(),
    },
  ],
  components: {
    dashboard: {
      managementState: 'Managed',
    },
  },
});
