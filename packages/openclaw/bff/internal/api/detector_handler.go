package api

import (
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

type DetectorResponse struct {
	Data DetectorData `json:"data"`
}

type DetectorData struct {
	DeploymentMode string `json:"deploymentMode"`
	Version        string `json:"version"`
}

// DetectorHandler returns deployment mode and version information
// This endpoint is used by mod-arch-core to detect the deployment configuration
func (app *App) DetectorHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	response := DetectorResponse{
		Data: DetectorData{
			DeploymentMode: "federated",
			Version:        Version,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
