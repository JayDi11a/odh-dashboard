# OpenClaw Module - Upstream Contribution Guide

## Overview

This document outlines the OpenClaw management module for ODH Dashboard and provides guidance for contributing it to the upstream `opendatahub-io/odh-dashboard` repository.

## What We've Built

### Architecture

```
┌─────────────────────────────────────────────────────┐
│   ODH Dashboard - OpenClaw Management Module        │
├─────────────────────────────────────────────────────┤
│  Frontend (React/PatternFly)                        │
│  • Configuration Form UI (pending)                  │
│  • Instance List & Management (pending)             │
│  • Navigation: "Agent Management" section           │
├─────────────────────────────────────────────────────┤
│  BFF (Go Backend)                                   │
│  • API endpoints for instance management           │
│  • Calls deployer service via HTTP                 │
├─────────────────────────────────────────────────────┤
│  Deployer Service (Node.js)                         │
│  • Wraps OpenClaw installer's OpenShift deployer   │
│  • Creates K8s resources (NS, SA, Secret, etc.)    │
│  • Manages OAuth proxy + Route                     │
└─────────────────────────────────────────────────────┘
```

### Implementation Status

✅ **Completed:**

1. Module scaffolding (`packages/openclaw/`)
2. Module Federation configuration (ports 9103 local, 8843 prod)
3. Feature flag (`disableOpenclaw`)
4. SupportedArea enum entry
5. Navigation extensions (sidebar + routes)
6. Node.js deployer service (complete implementation)
7. Go BFF API handlers (OpenClaw-specific endpoints)

🔄 **In Progress:**

1. Frontend UI components
2. OpenAPI specification
3. BFF dependency resolution (needs local patterns)

⏳ **Pending:**

1. Configuration form UI
2. Instance list/management UI
3. Unit tests
4. Contract tests
5. E2E tests
6. Documentation

---

## Contribution Strategy

### Phase 1: Proposal & RFC (Recommended First Step)

**Before submitting code**, create an RFC (Request for Comments) issue in the ODH Dashboard repo:

**Title:** `[RFC] OpenClaw Agent Management Module for ODH Dashboard`

**Content:**

```markdown
## Overview

Proposal to add OpenClaw deployment and management capabilities directly within ODH Dashboard.

## Problem Statement

Currently, users must:

1. Use the standalone OpenClaw installer CLI
2. Manually configure OpenShift resources
3. Manage instances outside the ODH Dashboard ecosystem

This creates friction and prevents a unified AI/ML management experience.

## Proposed Solution

Add an "Agent Management" section to ODH Dashboard that allows users to:

- Deploy OpenClaw instances with a form-based UI
- Choose model providers (Anthropic, OpenAI, Vertex AI, vLLM)
- Manage instance lifecycle (start, stop, delete)
- Monitor instance status

## Architecture

[Include architecture diagram from above]

## Implementation Phases

**Phase 1 (MVP):**

- Hybrid architecture: Go BFF + Node.js deployer service
- Basic deployment form
- Instance list view

**Phase 2 (Optimization):**

- Pure Go implementation (eliminate Node.js dependency)
- Enhanced UI
- Advanced configuration options

## Benefits

- ✅ Integrated user experience (no CLI needed)
- ✅ Reuses existing OAuth/RBAC from ODH
- ✅ Consistent with other ODH modules (Gen AI, Model Registry)
- ✅ Leverages existing OpenClaw installer logic

## Open Questions

1. Should this be a core module or optional plugin?
2. Preferred deployment pattern for Node.js service (Phase 1)?
3. Timeline expectations for migration to pure Go (Phase 2)?

## Related Work

- OpenClaw Installer: https://github.com/JayDi11a/openclaw-installer
- ODH Gen AI Module (similar architecture reference)
```

### Phase 2: Code Contribution

Once the RFC is approved, proceed with the PR:

#### **PR 1: Core Infrastructure**

```
Title: feat(openclaw): Add OpenClaw management module infrastructure

Files:
- packages/openclaw/ (module structure)
- frontend/src/concepts/areas/types.ts (SupportedArea.OPENCLAW)
- frontend/src/concepts/areas/const.ts (feature flag)
- frontend/src/k8sTypes.ts (disableOpenclaw flag)
- manifests/*/federation-configmap.yaml (federation config)
- packages/openclaw/frontend/src/odh/extensions.ts (navigation)

Scope: Module scaffolding, navigation, feature gating
```

#### **PR 2: Deployer Service**

```
Title: feat(openclaw): Add Node.js deployer service wrapper

Files:
- packages/openclaw/deployer-service/ (complete service)
- packages/openclaw/deployer-service/README.md

Scope: OpenShift deployment logic, K8s resource creation
```

#### **PR 3: Go BFF API**

```
Title: feat(openclaw): Add Go BFF API endpoints for OpenClaw instances

Files:
- packages/openclaw/bff/internal/api/openclaw_handlers.go
- packages/openclaw/bff/internal/integrations/deployer/client.go
- packages/openclaw/bff/api/openapi/openclaw.yaml (OpenAPI spec)

Scope: HTTP API, deployer service client
```

#### **PR 4: Frontend UI**

```
Title: feat(openclaw): Add configuration form and instance list UI

Files:
- packages/openclaw/frontend/src/app/InstanceList/
- packages/openclaw/frontend/src/app/ConfigurationForm/
- packages/openclaw/frontend/src/app/components/

Scope: React components, form validation, instance display
```

#### **PR 5: Tests & Documentation**

```
Title: test(openclaw): Add unit tests, contract tests, and documentation

Files:
- packages/openclaw/bff/__tests__/
- packages/openclaw/frontend/src/__tests__/
- packages/openclaw/contract-tests/
- packages/openclaw/README.md
- docs/openclaw-deployment.md

Scope: Test coverage, user documentation
```

---

## Key Technical Decisions

### 1. **Why Hybrid Architecture (Phase 1)?**

**Rationale:**

- **Speed to market**: Reuses proven OpenClaw installer deployer logic
- **Risk mitigation**: Avoids rewriting complex OAuth proxy configuration
- **Validation**: Proves concept before committing to pure Go rewrite

**Migration Path:**
Phase 1 (Node.js service) → Phase 2 (Pure Go) is a well-defined refactoring that doesn't affect the API contract.

### 2. **Module Federation vs Core Integration**

**Chosen:** Module Federation (federated remote)

**Why:**

- Consistent with Gen AI, Model Registry, MaaS patterns
- Allows independent versioning and deployment
- Feature can be disabled via `disableOpenclaw` flag
- Easier to maintain as a separate concern

### 3. **Feature Flag Strategy**

**Flag:** `disableOpenclaw: false` (enabled by default in tech preview)

**Rollout:**

1. Tech Preview (initial release)
2. GA after validation + pure Go migration

---

## Dependencies & Prerequisites

### Runtime Dependencies

- **Node.js 22+** (Phase 1 deployer service)
- **Go 1.24+** (BFF)
- **OpenShift cluster** (for deployment target)

### ODH Dashboard Integration

- **Module Federation**: Port 9103 (local), 8843 (production)
- **Feature Flag**: `disableOpenclaw`
- **Navigation**: "Agent Management" section (group 5)

---

## Testing Strategy

### Unit Tests

- **BFF**: Go unit tests for handlers and deployer client
- **Frontend**: Jest tests for components and hooks
- **Deployer Service**: Node.js unit tests for deployment logic

### Contract Tests

- **Framework**: `@odh-dashboard/contract-tests`
- **Scope**: BFF API endpoints against OpenAPI spec
- **Mock**: BFF with mocked deployer service

### E2E Tests

- **Framework**: Cypress
- **Scope**: Full deployment workflow on live cluster
- **Location**: `packages/cypress/cypress/tests/e2e/openclaw/`

---

## Documentation Requirements

### User Documentation

- **Deployment Guide**: How to deploy OpenClaw from ODH Dashboard
- **Configuration Reference**: Model providers, credentials, settings
- **Troubleshooting**: Common issues and solutions

### Developer Documentation

- **Architecture Overview**: Component interaction, data flow
- **API Reference**: BFF endpoints, request/response formats
- **Contributing Guide**: How to extend or modify the module

---

## Migration Path: Phase 1 → Phase 2

### Phase 2: Pure Go Implementation

**Goal:** Eliminate Node.js runtime dependency

**Approach:**

1. Rewrite deployer logic in Go using `client-go`
2. Embed OAuth proxy configuration in Go BFF
3. Replace HTTP calls to deployer service with direct K8s API calls
4. Maintain same external API contract (no frontend changes)

**Benefits:**

- ✅ Single runtime (Go only)
- ✅ Simpler deployment (one container)
- ✅ Better performance
- ✅ Easier to maintain long-term

**Estimated Effort:** 2-3 weeks (after Phase 1 validation)

---

## Upstream Contribution Checklist

### Before Submitting

- [ ] Create RFC issue in odh-dashboard repo
- [ ] Get community feedback on architecture
- [ ] Align on contribution timeline
- [ ] Ensure all code follows ODH Dashboard conventions

### PR Requirements

- [ ] All linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Unit tests written and passing
- [ ] Contract tests written and passing
- [ ] E2E tests written (may run in upstream CI)
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] No merge conflicts with main branch

### Community Engagement

- [ ] Join ODH community Slack/Matrix
- [ ] Attend community meetings if possible
- [ ] Respond to PR feedback promptly
- [ ] Offer to present feature in community demo

---

## Contact & Support

**GitHub Issues:** https://github.com/opendatahub-io/odh-dashboard/issues
**Community Slack:** https://join.slack.com/t/odh-io/shared_invite/...

**This Module:**

- Original implementation: [Your GitHub username]
- OpenClaw installer: https://github.com/JayDi11a/openclaw-installer

---

## Next Steps

1. **Review this guide** and ensure alignment with your goals
2. **Create RFC issue** in odh-dashboard repo
3. **Gather feedback** from maintainers
4. **Fix BFF dependencies** (replace mod-arch-library imports with local patterns from gen-ai/model-registry)
5. **Build frontend UI** (configuration form + instance list)
6. **Write tests** (unit, contract, E2E)
7. **Submit PRs** following the phased approach above

Good luck with your contribution! 🚀
