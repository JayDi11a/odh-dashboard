/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Overlay file copied into the starter repo where path aliases are configured.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  BrowserStorageContextProvider,
  NotificationContextProvider,
  ModularArchContextProvider,
  ModularArchConfig,
  DeploymentMode,
} from 'mod-arch-core';
import App from './app/App';

const URL_PREFIX = '/openclaw';
const BFF_API_VERSION = 'v1';
const DEPLOYMENT_MODE = DeploymentMode.Federated;
const MANDATORY_NAMESPACE = undefined;

const root = ReactDOM.createRoot(document.getElementById('root')!);

const modularArchConfig: ModularArchConfig = {
  deploymentMode: DEPLOYMENT_MODE,
  URL_PREFIX,
  BFF_API_VERSION,
  mandatoryNamespace: MANDATORY_NAMESPACE,
};

root.render(
  <React.StrictMode>
    <Router>
      <ModularArchContextProvider config={modularArchConfig}>
        <BrowserStorageContextProvider>
          <NotificationContextProvider>
            <App />
          </NotificationContextProvider>
        </BrowserStorageContextProvider>
      </ModularArchContextProvider>
    </Router>
  </React.StrictMode>,
);
