package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/julienschmidt/httprouter"
	"github.com/opendatahub-io/odh-dashboard/packages/openclaw/bff/internal/integrations/deployer"
)

// DeployInstanceHandler handles POST /api/instances
func (app *App) DeployInstanceHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var config deployer.DeploymentConfig

	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate required fields
	if config.AgentName == "" {
		httpError := &HTTPError{
			StatusCode: http.StatusBadRequest,
			Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "agentName is required"},
		}
		app.errorResponse(w, r, httpError)
		return
	}

	if config.ModelProvider == "" || config.ModelName == "" {
		httpError := &HTTPError{
			StatusCode: http.StatusBadRequest,
			Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "modelProvider and modelName are required"},
		}
		app.errorResponse(w, r, httpError)
		return
	}

	// Validate credentials based on provider
	switch config.ModelProvider {
	case "anthropic":
		if config.AnthropicAPIKey == "" {
			httpError := &HTTPError{
				StatusCode: http.StatusBadRequest,
				Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "anthropicApiKey is required for Anthropic provider"},
			}
			app.errorResponse(w, r, httpError)
			return
		}
	case "openai":
		if config.OpenAIAPIKey == "" {
			httpError := &HTTPError{
				StatusCode: http.StatusBadRequest,
				Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "openaiApiKey is required for OpenAI provider"},
			}
			app.errorResponse(w, r, httpError)
			return
		}
	case "vertex":
		if config.GCPServiceAccountJSON == "" {
			httpError := &HTTPError{
				StatusCode: http.StatusBadRequest,
				Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "gcpServiceAccountJson is required for Vertex AI provider"},
			}
			app.errorResponse(w, r, httpError)
			return
		}
	case "vllm":
		if config.ModelEndpoint == "" {
			httpError := &HTTPError{
				StatusCode: http.StatusBadRequest,
				Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "modelEndpoint is required for vLLM provider"},
			}
			app.errorResponse(w, r, httpError)
			return
		}
	default:
		httpError := &HTTPError{
			StatusCode: http.StatusBadRequest,
			Error:      ErrorPayload{Code: strconv.Itoa(http.StatusBadRequest), Message: "invalid modelProvider: must be anthropic, openai, vertex, or vllm"},
		}
		app.errorResponse(w, r, httpError)
		return
	}

	app.logger.Info("Deploying OpenClaw instance",
		slog.String("agentName", config.AgentName),
		slog.String("modelProvider", config.ModelProvider),
		slog.String("modelName", config.ModelName),
	)

	result, err := app.deployerClient.Deploy(config)
	if err != nil {
		app.logger.Error("Failed to deploy instance", slog.String("error", err.Error()))
		app.serverErrorResponse(w, r, err)
		return
	}

	if !result.Success {
		httpError := &HTTPError{
			StatusCode: http.StatusInternalServerError,
			Error:      ErrorPayload{Code: strconv.Itoa(http.StatusInternalServerError), Message: result.Error},
		}
		app.errorResponse(w, r, httpError)
		return
	}

	app.logger.Info("Successfully deployed instance",
		slog.String("agentName", result.AgentName),
		slog.String("namespace", result.Namespace),
		slog.String("routeUrl", result.RouteURL),
	)

	if err := app.WriteJSON(w, http.StatusCreated, result, nil); err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// ListInstancesHandler handles GET /api/instances
func (app *App) ListInstancesHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	app.logger.Info("Listing OpenClaw instances")

	result, err := app.deployerClient.ListInstances()
	if err != nil {
		app.logger.Error("Failed to list instances", slog.String("error", err.Error()))
		app.serverErrorResponse(w, r, err)
		return
	}

	if err := app.WriteJSON(w, http.StatusOK, result, nil); err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// GetInstanceHandler handles GET /api/instances/:name
func (app *App) GetInstanceHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	name := ps.ByName("name")
	namespace := r.URL.Query().Get("namespace")

	app.logger.Info("Getting instance status",
		slog.String("name", name),
		slog.String("namespace", namespace),
	)

	status, err := app.deployerClient.GetInstance(name, namespace)
	if err != nil {
		app.logger.Error("Failed to get instance", slog.String("error", err.Error()))
		app.serverErrorResponse(w, r, err)
		return
	}

	if status == nil {
		app.notFoundResponse(w, r)
		return
	}

	if err := app.WriteJSON(w, http.StatusOK, status, nil); err != nil {
		app.serverErrorResponse(w, r, err)
	}
}

// DeleteInstanceHandler handles DELETE /api/instances/:name
func (app *App) DeleteInstanceHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	name := ps.ByName("name")
	namespace := r.URL.Query().Get("namespace")

	app.logger.Info("Deleting instance",
		slog.String("name", name),
		slog.String("namespace", namespace),
	)

	if err := app.deployerClient.DeleteInstance(name, namespace); err != nil {
		app.logger.Error("Failed to delete instance", slog.String("error", err.Error()))
		app.serverErrorResponse(w, r, err)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Instance deleted successfully",
		"name":    name,
	}

	if err := app.WriteJSON(w, http.StatusOK, response, nil); err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
