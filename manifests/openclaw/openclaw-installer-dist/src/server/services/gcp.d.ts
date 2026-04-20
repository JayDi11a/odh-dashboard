export interface GcpDefaults {
    projectId: string | null;
    location: string | null;
    serviceAccountJsonPath: string | null;
    serviceAccountJson: string | null;
    credentialType: string | null;
    sources: {
        projectId?: string;
        location?: string;
        credentials?: string;
    };
}
export declare function detectGcpDefaults(): Promise<GcpDefaults>;
/**
 * Return the default Vertex AI location for a given provider.
 * OpenClaw requires a location to register the provider — without it,
 * the model is reported as "Unknown".
 */
export declare function defaultVertexLocation(vertexProvider: string): string;
