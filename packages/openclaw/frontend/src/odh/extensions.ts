import type {
  NavExtension,
  RouteExtension,
  AreaExtension,
} from '@odh-dashboard/plugin-core/extension-points';

const OPENCLAW = 'openclaw';

const extensions: (NavExtension | RouteExtension | AreaExtension)[] = [
  {
    type: 'app.area',
    properties: {
      id: OPENCLAW,
      featureFlags: ['disableOpenclaw'],
    },
  },
  {
    type: 'app.navigation/section',
    flags: {
      required: [OPENCLAW],
    },
    properties: {
      id: 'agent-management',
      title: 'Agent Management',
      group: '5_agent_management',
      iconRef: () => import('./OpenclawNavIcon'),
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [OPENCLAW],
    },
    properties: {
      id: 'openclaw-instances',
      title: 'OpenClaw Instances',
      href: '/openclaw/instances',
      section: 'agent-management',
      path: '/openclaw/*',
      label: 'Tech Preview',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [OPENCLAW],
    },
    properties: {
      path: '/openclaw/*',
      component: () => import('./OpenclawWrapper'),
    },
  },
];

export default extensions;
