import console from "node:console";
export class DeployerRegistry {
    registrations = new Map();
    _loadErrors = [];
    /** Set before calling plugin.register() so that source is auto-applied. */
    currentSource = "built-in";
    register(reg) {
        if (this.registrations.has(reg.mode)) {
            console.warn(`DeployerRegistry: overwriting existing registration for mode "${reg.mode}"`);
        }
        this.registrations.set(reg.mode, { ...reg, source: reg.source ?? this.currentSource });
    }
    get(mode) {
        return this.registrations.get(mode)?.deployer ?? null;
    }
    list() {
        return Array.from(this.registrations.values());
    }
    addLoadError(err) {
        this._loadErrors.push(err);
    }
    loadErrors() {
        return [...this._loadErrors];
    }
    async detect() {
        const results = [];
        for (const reg of this.registrations.values()) {
            if (!reg.detect) {
                results.push(reg);
                continue;
            }
            try {
                if (await reg.detect()) {
                    results.push(reg);
                }
            }
            catch {
                // detect failed — treat as unavailable
            }
        }
        return results;
    }
}
export const registry = new DeployerRegistry();
