import { DataScienceClusterInitializationKindStatus } from '../../../types';

export const getMockDsciStatus = (): DataScienceClusterInitializationKindStatus => ({
  phase: 'Ready',
  conditions: [
    {
      type: 'Ready',
      status: 'True',
      reason: 'ReconcileCompleted',
      message: 'Mock DSCI for local development',
      lastTransitionTime: new Date().toISOString(),
      lastHeartbeatTime: new Date().toISOString(),
    },
  ],
});
