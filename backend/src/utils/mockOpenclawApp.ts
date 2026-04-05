import { OdhApplication } from '../types';

/**
 * Mock OpenClaw OdhApplication for local development
 * Matches the structure defined in manifests/common/apps/openclaw/openclaw-app.yaml
 */
export const getMockOpenclawApplication = (): OdhApplication => ({
  metadata: {
    name: 'openclaw',
    annotations: {
      'opendatahub.io/categories': 'AI agents,Automation,Agent orchestration',
    },
  },
  spec: {
    displayName: 'OpenClaw',
    provider: 'Red Hat',
    support: 'red hat',
    category: 'Third party support',
    docsLink: 'https://github.com/JayDi11a/openclaw-installer',
    getStartedLink: 'https://github.com/JayDi11a/openclaw-installer/blob/main/README.md',
    description:
      'OpenClaw is an AI agent orchestration platform that enables deployment and management of intelligent agents. Install OpenClaw to create, deploy, and manage AI agents with MCP (Model Context Protocol) server integration.',
    comingSoon: false,
    consoleLink: '',
    csvName: '',
    endpoint: '',
    link: '',
    quickStart: '',
    route: '',
    routeNamespace: '',
    routeSuffix: '',
    serviceName: '',
    enableCR: {
      group: '',
      name: '',
      plural: '',
      version: '',
    },
    getStartedMarkDown: `# OpenClaw

OpenClaw provides an AI agent orchestration platform for deploying and managing intelligent agents on OpenShift.

## What you'll get

- Agent orchestration and lifecycle management
- MCP (Model Context Protocol) server integration
- Web UI for agent configuration and monitoring
- REST API for programmatic agent management

## Prerequisites

- OpenShift cluster with admin access
- OpenDataHub or RHOAI installed
- Sufficient cluster resources (minimum 2 CPU, 4Gi memory)

## Installation

1. Locate the **OpenClaw** card on the **Enabled applications** page
2. Click **Enable** to install OpenClaw on your cluster
3. The installer will deploy the OpenClaw operator and components
4. Once installed, click **Open application** to access the OpenClaw UI

## What gets installed

- OpenClaw Operator
- OpenClaw BFF (Backend-for-Frontend) service
- OpenClaw frontend UI
- Required CRDs for agent management`,
    img: `data:image/png;base64,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`,
    enable: {
      title: 'Install OpenClaw',
      description: 'Deploy OpenClaw agent orchestration platform on your cluster',
      actionLabel: 'Install',
      link: 'https://github.com/JayDi11a/openclaw-installer',
      linkPreface: 'Installation guide',
      inProgressText: 'Installing OpenClaw components...',
      validationJob: 'openclaw-installer',
      validationSecret: 'openclaw-enable-secret',
      validationConfigMap: 'openclaw-enable-validation-result',
      variables: {
        OPENCLAW_NAMESPACE: 'opendatahub',
      },
      variableDisplayText: {
        OPENCLAW_NAMESPACE: 'Target namespace for OpenClaw installation',
      },
      variableHelpText: {
        OPENCLAW_NAMESPACE: 'The OpenShift namespace where OpenClaw will be installed',
      },
    },
    beta: true,
    betaTitle: 'Technology Preview',
    betaText: 'OpenClaw is currently in Technology Preview. Features and APIs may change.',
    isEnabled: false,
    shownOnEnabledPage: false,
  },
});
