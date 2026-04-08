import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader } from '@patternfly/react-core';

const OpenclawWrapper: React.FC = () => (
  <EmptyState>
    <EmptyStateHeader titleText="OpenClaw" headingLevel="h1" />
    <EmptyStateBody>
      OpenClaw agent orchestration platform.
      <br />
      <br />
      Full functionality coming soon.
    </EmptyStateBody>
  </EmptyState>
);

export default OpenclawWrapper;
