import * as React from 'react';
import { getValidationStatus } from '#~/services/validateIsvService';

/**
 * Hook to check if OpenClaw installation is complete
 * Returns true if installation is complete, false otherwise
 */
export const useOpenClawInstallationStatus = (appName: string, enabled: boolean): boolean => {
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let intervalHandle: ReturnType<typeof setInterval> | undefined;

    const checkStatus = () => {
      if (!enabled) {
        setIsInstalled(false);
        return;
      }

      getValidationStatus(appName)
        .then((response) => {
          if (!cancelled) {
            setIsInstalled(response.complete && response.valid);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsInstalled(false);
          }
        });
    };

    if (enabled) {
      // Check immediately
      checkStatus();
      // Then poll every 10 seconds while not installed
      if (!isInstalled) {
        intervalHandle = setInterval(checkStatus, 10 * 1000);
      }
    }

    return () => {
      cancelled = true;
      if (intervalHandle !== undefined) {
        clearInterval(intervalHandle);
      }
    };
  }, [appName, enabled, isInstalled]);

  return isInstalled;
};
