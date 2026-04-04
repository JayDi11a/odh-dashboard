import React from 'react';
import {
  PageSection,
  Title,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { PlusCircleIcon, CubesIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { listInstances, InstanceStatus } from '../api/openclaw';

const InstanceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = React.useState<InstanceStatus[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchInstances = async () => {
      try {
        setLoading(true);
        const result = await listInstances('')({});
        setInstances(result.instances);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load instances');
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, []);

  const handleDeployNew = () => {
    navigate('/openclaw/instances/deploy');
  };

  if (loading) {
    return (
      <PageSection>
        <Title headingLevel="h1">Loading...</Title>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Title headingLevel="h1">Error</Title>
        <p>{error}</p>
      </PageSection>
    );
  }

  if (instances.length === 0) {
    return (
      <PageSection>
        <EmptyState
          titleText="No OpenClaw instances"
          icon={CubesIcon}
          headingLevel="h1"
          variant="lg"
        >
          <EmptyStateBody>Deploy your first OpenClaw agent instance to get started.</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={handleDeployNew} icon={<PlusCircleIcon />}>
                Deploy OpenClaw instance
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Title headingLevel="h1">OpenClaw Instances</Title>
        <Button variant="primary" onClick={handleDeployNew} icon={<PlusCircleIcon />}>
          Deploy new instance
        </Button>
      </div>

      <Table aria-label="OpenClaw instances table" variant="compact">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Namespace</Th>
            <Th>Status</Th>
            <Th>URL</Th>
            <Th>Gateway Token</Th>
            <Th>Created</Th>
          </Tr>
        </Thead>
        <Tbody>
          {instances.map((instance) => (
            <Tr key={`${instance.namespace}-${instance.name}`}>
              <Td dataLabel="Name">{instance.name}</Td>
              <Td dataLabel="Namespace">{instance.namespace}</Td>
              <Td dataLabel="Status">{instance.status}</Td>
              <Td dataLabel="URL">
                {instance.routeUrl ? (
                  <a href={instance.routeUrl} target="_blank" rel="noopener noreferrer">
                    {instance.routeUrl}
                  </a>
                ) : (
                  'Pending'
                )}
              </Td>
              <Td dataLabel="Gateway Token">
                {instance.gatewayToken ? (
                  <code style={{ fontSize: '0.85em' }}>{instance.gatewayToken}</code>
                ) : (
                  'Pending'
                )}
              </Td>
              <Td dataLabel="Created">
                {instance.createdAt ? new Date(instance.createdAt).toLocaleString() : 'Unknown'}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageSection>
  );
};

export default InstanceListPage;
