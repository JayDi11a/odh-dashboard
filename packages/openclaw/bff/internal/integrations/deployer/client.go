package deployer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client wraps HTTP calls to the Node.js deployer service
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new deployer service client
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Minute, // Deployments can take time
		},
	}
}

// DeploymentConfig represents the deployment configuration
type DeploymentConfig struct {
	AgentName             string `json:"agentName"`
	Namespace             string `json:"namespace,omitempty"`
	ModelProvider         string `json:"modelProvider"` // anthropic, openai, vertex, vllm
	ModelName             string `json:"modelName"`
	ModelEndpoint         string `json:"modelEndpoint,omitempty"`
	AnthropicAPIKey       string `json:"anthropicApiKey,omitempty"`
	OpenAIAPIKey          string `json:"openaiApiKey,omitempty"`
	GCPServiceAccountJSON string `json:"gcpServiceAccountJson,omitempty"`
	Image                 string `json:"image,omitempty"`
	SandboxEnabled        bool   `json:"sandboxEnabled,omitempty"`
	SandboxBackend        string `json:"sandboxBackend,omitempty"`
	RouteHost             string `json:"routeHost,omitempty"`
}

// DeploymentResult represents the deployment response
type DeploymentResult struct {
	Success      bool   `json:"success"`
	AgentName    string `json:"agentName"`
	Namespace    string `json:"namespace"`
	RouteURL     string `json:"routeUrl,omitempty"`
	GatewayToken string `json:"gatewayToken,omitempty"`
	Error        string `json:"error,omitempty"`
}

// InstanceStatus represents an instance's status
type InstanceStatus struct {
	Name          string `json:"name"`
	Namespace     string `json:"namespace"`
	Status        string `json:"status"` // Running, Pending, Failed, Unknown
	RouteURL      string `json:"routeUrl,omitempty"`
	GatewayToken  string `json:"gatewayToken,omitempty"`
	ModelProvider string `json:"modelProvider,omitempty"`
	ModelName     string `json:"modelName,omitempty"`
	CreatedAt     string `json:"createdAt,omitempty"`
}

// ListInstancesResult represents the list response
type ListInstancesResult struct {
	Instances []InstanceStatus `json:"instances"`
}

// Deploy deploys a new OpenClaw instance
func (c *Client) Deploy(config DeploymentConfig) (*DeploymentResult, error) {
	body, err := json.Marshal(config)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal deployment config: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/deploy", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call deployer service: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result DeploymentResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return &result, fmt.Errorf("deployment failed: %s", result.Error)
	}

	return &result, nil
}

// GetInstance retrieves status of a specific instance
func (c *Client) GetInstance(name string, namespace string) (*InstanceStatus, error) {
	url := fmt.Sprintf("%s/instances/%s", c.baseURL, name)
	if namespace != "" {
		url = url + "?namespace=" + namespace
	}

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get instance: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil // Instance not found
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var status InstanceStatus
	if err := json.Unmarshal(body, &status); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &status, nil
}

// ListInstances retrieves all OpenClaw instances
func (c *Client) ListInstances() (*ListInstancesResult, error) {
	resp, err := c.httpClient.Get(c.baseURL + "/instances")
	if err != nil {
		return nil, fmt.Errorf("failed to list instances: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result ListInstancesResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}

// DeleteInstance deletes an OpenClaw instance
func (c *Client) DeleteInstance(name string, namespace string) error {
	url := fmt.Sprintf("%s/instances/%s", c.baseURL, name)
	if namespace != "" {
		url = url + "?namespace=" + namespace
	}

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete instance: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed: %s", string(body))
	}

	return nil
}

// HealthCheck checks if the deployer service is healthy
func (c *Client) HealthCheck() error {
	resp, err := c.httpClient.Get(c.baseURL + "/health")
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("deployer service unhealthy: status %d", resp.StatusCode)
	}

	return nil
}
