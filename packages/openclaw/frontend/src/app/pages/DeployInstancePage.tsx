import React from 'react';
import {
  PageSection,
  Title,
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
  ActionGroup,
  Alert,
  Spinner,
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import { deployInstance, DeploymentConfig } from '../api/openclaw';

type ModelProvider = 'anthropic' | 'openai' | 'vertex' | 'vllm';

const DeployInstancePage: React.FC = () => {
  const navigate = useNavigate();

  const [agentName, setAgentName] = React.useState('');
  const [modelProvider, setModelProvider] = React.useState<ModelProvider>('anthropic');
  const [modelName, setModelName] = React.useState('');
  const [anthropicApiKey, setAnthropicApiKey] = React.useState('');
  const [openaiApiKey, setOpenaiApiKey] = React.useState('');
  const [gcpServiceAccountJson, setGcpServiceAccountJson] = React.useState('');
  const [modelEndpoint, setModelEndpoint] = React.useState('');

  const [deploying, setDeploying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [deploymentResult, setDeploymentResult] = React.useState<{
    routeURL?: string;
    gatewayToken?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(false);
    setDeploying(true);

    try {
      const config: DeploymentConfig = {
        agentName,
        modelProvider,
        modelName,
      };

      // Add provider-specific credentials
      switch (modelProvider) {
        case 'anthropic':
          config.anthropicApiKey = anthropicApiKey;
          break;
        case 'openai':
          config.openaiApiKey = openaiApiKey;
          break;
        case 'vertex':
          config.gcpServiceAccountJson = gcpServiceAccountJson;
          break;
        case 'vllm':
          config.modelEndpoint = modelEndpoint;
          break;
      }

      const result = await deployInstance('')({}, config);

      if (result.success) {
        setSuccess(true);
        setDeploymentResult({
          routeURL: result.routeURL,
          gatewayToken: result.gatewayToken,
        });
        // Don't auto-redirect - let user copy the gateway token first
      } else {
        setError(result.error || 'Deployment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleCancel = () => {
    navigate('/openclaw/instances');
  };

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1.5rem' }}>
        Deploy OpenClaw Instance
      </Title>

      {error && (
        <Alert variant="danger" title="Deployment failed" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      {success && deploymentResult && (
        <Alert variant="success" title="Deployment Successful!" style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Your OpenClaw instance has been deployed successfully. Save the following credentials:
          </p>
          <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>WebSocket URL:</strong>
            </p>
            <code style={{ display: 'block', marginBottom: '1rem', wordBreak: 'break-all' }}>
              {deploymentResult.routeURL?.replace('https://', 'wss://')}
            </code>

            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Gateway Token:</strong>
            </p>
            <code style={{ display: 'block', marginBottom: '1rem', wordBreak: 'break-all' }}>
              {deploymentResult.gatewayToken || 'Generating...'}
            </code>
          </div>
          <p style={{ marginTop: '1rem' }}>
            <Button variant="link" onClick={() => navigate('/openclaw/instances')}>
              View all instances
            </Button>
          </p>
        </Alert>
      )}

      {!success && (
        <Form onSubmit={handleSubmit}>
        <FormGroup label="Agent Name" isRequired fieldId="agent-name">
          <TextInput
            isRequired
            type="text"
            id="agent-name"
            name="agent-name"
            value={agentName}
            onChange={(_event, value) => setAgentName(value)}
            placeholder="my-agent"
          />
        </FormGroup>

        <FormGroup label="Model Provider" isRequired fieldId="model-provider">
          <FormSelect
            value={modelProvider}
            onChange={(_event, value) => {
              if (
                value === 'anthropic' ||
                value === 'openai' ||
                value === 'vertex' ||
                value === 'vllm'
              ) {
                setModelProvider(value);
              }
            }}
            id="model-provider"
            name="model-provider"
            aria-label="Model Provider"
          >
            <FormSelectOption key="anthropic" value="anthropic" label="Anthropic (Claude)" />
            <FormSelectOption key="openai" value="openai" label="OpenAI (GPT)" />
            <FormSelectOption key="vertex" value="vertex" label="Vertex AI (Gemini)" />
            <FormSelectOption key="vllm" value="vllm" label="vLLM (Self-hosted)" />
          </FormSelect>
        </FormGroup>

        <FormGroup label="Model Name" isRequired fieldId="model-name">
          <TextInput
            isRequired
            type="text"
            id="model-name"
            name="model-name"
            value={modelName}
            onChange={(_event, value) => setModelName(value)}
            placeholder={
              modelProvider === 'anthropic'
                ? 'claude-3-5-sonnet-20241022'
                : modelProvider === 'openai'
                  ? 'gpt-4'
                  : modelProvider === 'vertex'
                    ? 'gemini-pro'
                    : 'meta-llama/Llama-2-7b'
            }
          />
        </FormGroup>

        {modelProvider === 'anthropic' && (
          <FormGroup label="Anthropic API Key" isRequired fieldId="anthropic-api-key">
            <TextInput
              isRequired
              type="password"
              id="anthropic-api-key"
              name="anthropic-api-key"
              value={anthropicApiKey}
              onChange={(_event, value) => setAnthropicApiKey(value)}
              placeholder="sk-ant-..."
            />
          </FormGroup>
        )}

        {modelProvider === 'openai' && (
          <FormGroup label="OpenAI API Key" isRequired fieldId="openai-api-key">
            <TextInput
              isRequired
              type="password"
              id="openai-api-key"
              name="openai-api-key"
              value={openaiApiKey}
              onChange={(_event, value) => setOpenaiApiKey(value)}
              placeholder="sk-..."
            />
          </FormGroup>
        )}

        {modelProvider === 'vertex' && (
          <FormGroup label="GCP Service Account JSON" isRequired fieldId="gcp-service-account-json">
            <TextInput
              isRequired
              type="password"
              id="gcp-service-account-json"
              name="gcp-service-account-json"
              value={gcpServiceAccountJson}
              onChange={(_event, value) => setGcpServiceAccountJson(value)}
              placeholder="Paste your GCP service account JSON here"
            />
          </FormGroup>
        )}

        {modelProvider === 'vllm' && (
          <FormGroup label="Model Endpoint" isRequired fieldId="model-endpoint">
            <TextInput
              isRequired
              type="url"
              id="model-endpoint"
              name="model-endpoint"
              value={modelEndpoint}
              onChange={(_event, value) => setModelEndpoint(value)}
              placeholder="http://vllm-service:8000"
            />
          </FormGroup>
        )}

        <ActionGroup>
          <Button variant="primary" type="submit" isDisabled={deploying}>
            {deploying ? (
              <>
                <Spinner size="sm" style={{ marginRight: '0.5rem' }} />
                Deploying...
              </>
            ) : (
              'Deploy'
            )}
          </Button>
          <Button variant="link" onClick={handleCancel} isDisabled={deploying}>
            Cancel
          </Button>
        </ActionGroup>
      </Form>
      )}
    </PageSection>
  );
};

export default DeployInstancePage;
