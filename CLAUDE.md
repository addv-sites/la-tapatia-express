# Ahogadas La Tapatía Express — Contexto del Proyecto

Protocolo de trabajo: skill `addv-web-app` (analizar → revisar impacto → criticar y mejorar → propuesta visual → confirmar → implementar → probar → asegurar). Ver también `project_state.md` (estado/decisiones) y `addv/cmem.md` (historial comprimido de la conversación).

## Stack y restricciones duras

- **Despliegue:** GitHub Pages únicamente. Repo público, sin dominio propio (`usuario.github.io/repo`).
- **Sin backend tradicional:** nada de Node server permanente, PHP, VPS, base de datos propia. Toda escritura de datos pasa por Google Apps Script (Web App serverless) — es la única capa de "backend".
- **Datos:** Google Sheets es la única base de datos (catálogo, pedidos, clientes, staff, repartidores, config, auditoría).
- **Mapas/geolocalización:** OpenStreetMap + Leaflet + Nominatim (gratis, sin API key). Nunca Google Maps Platform (tiene costo).
- **WhatsApp:** solo deep-links `wa.me` iniciados por el usuario. Nunca WhatsApp Business API ni bot conversacional automatizado (no es viable sin servidor persistente).
- **Costo cero (fase POC):** ninguna herramienta de pago nueva. El Workspace de ADDV es costo preexistente, no nuevo por este proyecto. Revisar antes de agregar cualquier dependencia con tier de pago.
- **PWA:** instalable (manifest + service worker), botón "Instalar" con comportamiento dual (prompt real en Android/desktop, modal instructivo en iOS). Sin push notifications (requiere servidor, fuera de alcance v1).

## Las 6 superficies del proyecto

| Superficie | Diseño en | Acceso |
|---|---|---|
| Sitio público (menú, carrito, checkout, WhatsApp) | `design/` | Público, invitado o Google Sign-In opcional |
| Admin catálogo/precios/fotos | `admin/administrador_de_precios...` | Google Sign-In + whitelist hoja STAFF |
| Admin pedidos/KDS (comandas en vivo) | `admin/gestion_de_pedidos...` | Google Sign-In + whitelist hoja STAFF |
| Portal cliente (rastreo, historial, perfil) | `pc/` | Google Sign-In abierto (cualquier cuenta Google) |
| Analítica/BI (geoespacial, CRM, tarifas) | `analitica/` | Google Sign-In + dominio `@addv.mx` |
| App repartidor | `reparto/` | Google Sign-In + whitelist hoja DRIVERS |

Todas comparten el mismo sistema de diseño (`*/DESIGN.md`, idénticos entre carpetas: paleta chile-de-árbol/mostaza/crema, Epilogue + Plus Jakarta Sans).

## Modelo de datos (hojas Google Sheets)

`CATALOGO`, `PEDIDOS` (folio simple `#TA-0001`, status enum `pendiente→confirmado→en_cocina→listo→entregado` + `cancelado`/`abandonado`, snapshot de precio, `branch_id`, `cash_denomination` opcional), `SUCURSALES`, `CONFIG` (`delivery_enabled`, tarifas por zona Z1/Z2/Z3, `driver_fixed_commission`, mensajes, horarios), `STAFF`, `CLIENTES` (CRM, opt-in marketing), `DRIVERS`, `LOG` (auditoría), `INCIDENCIAS`.

## Reglas duras heredadas de `buildClaude.md`/`stitch.md`/`seo.md`

- Nunca inventar precios, horarios, promociones, testimonios, cobertura o costos — dato faltante = variable configurable + marcado `requiresValidation`, nunca un valor inventado.
- Nada sensible en el frontend (keys, tokens, credenciales, PII) — todo secreto vive y se valida server-side en Apps Script.
- Toda verificación de identidad (STAFF/DRIVERS/ADDV/cliente) pasa por el ID token de Google verificado criptográficamente en Apps Script — nunca confiar en un email que mande el cliente.
- Rutas reales por sección (`/menu/`, `/ubicacion/`, etc.), no anclas `#` — requisito de SEO.
- Catálogo: snapshot en build-time (GitHub Action) + revalidación silenciosa en cliente — nunca bloquear el LCP con el fetch a Sheets.
- Animaciones solo `transform`/`opacity`, respetan `prefers-reduced-motion`.
- Cero animaciones/journeys que prometan datos no reales (tráfico en vivo, ratings, disponibilidad) sin fuente real detrás.

## Comandos frecuentes

_Aún no existe tooling de build — se define en el primer segmento de construcción. Se documentará aquí (`npm run build`, `npm test`, servidor local, etc.) en cuanto exista `package.json`._

---

# Ruflo — Claude Code Configuration

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to user commits unless this project's `.claude/settings.json` has `attribution.commit` set (#2078). The Claude Code Bash tool may suggest one in its default commit-message template — ignore it. `Co-Authored-By` is semantic authorship attribution under git/GitHub convention; the tool is the facilitator, not a co-author.
- Keep files under 500 lines
- Validate input at system boundaries

## Ruflo Capability Brain & Implementation Loop

Ruflo is the coordination ledger and policy decision point. Claude Code is the
executor: after a Ruflo coordination call, continue implementing the task.

When it is registered, call
`guidance_brain({ mode: "recommend", task: "..." })` before complex Ruflo
work. Use its live registry instead of guessing tool names. Treat
`registered`, `configured`, `reachable`, `healthy`, and `authorized`
as separate facts. If the brain is unavailable, continue with the compatible
`guidance_recommend` tool, CLI discovery, and repository instructions.

Follow the returned loop:

1. Recall memory and ADR constraints.
2. Inspect source, runtime, dependencies, policy, and health.
3. Route to the smallest capable topology, agents, skills, and tools.
4. Plan acceptance criteria, safety envelope, ownership, and validation.
5. Execute in isolated scopes; the coding agent performs the work.
6. Test focused, regression, and failure paths.
7. Validate types, security, policy, compatibility, and artifacts.
8. Benchmark a source-bound candidate against a source-bound baseline.
9. Optimize measured bottlenecks without weakening safety.
10. Bind claims and evidence to exact source/build receipts.
11. Reconcile concurrent handoffs and disclose limitations.
12. Publish only through a separately authorized release gate.

### Concurrency and authority

- Never allow two writers in one worktree; give each writing agent an isolated
  worktree and explicit file ownership.
- Read-only research may run concurrently and report findings to the owner.
- Only the integration owner edits shared manifests and lockfiles or reconciles
  overlapping changes.
- A child may drop capabilities but cannot add tools, network, secrets, spend,
  concurrency, namespaces, or delegation depth.
- A lease or claim coordinates ownership; it does not authorize a side effect.
- Darwin, Flywheel, MetaHarness, memory, and neural systems may propose or
  evaluate candidates but cannot self-promote or expand their SafetyEnvelope.
- Bind tests, benchmarks, policy decisions, and release evidence to an exact
  commit or immutable dirty-worktree snapshot.

## Agent Comms (SendMessage-First Coordination)

Named agents coordinate via `SendMessage`, not polling or shared state.

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Spawning a Coordinated Team

```javascript
// ALL agents in ONE message, each knows WHO to message next
Agent({ prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher", name: "researcher", run_in_background: true })
Agent({ prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect", name: "architect", run_in_background: true })
Agent({ prompt: "Wait for 'architect'. Implement it. SendMessage to 'tester'.",
  subagent_type: "coder", name: "coder", run_in_background: true })
Agent({ prompt: "Wait for 'coder'. Write tests. SendMessage results to 'reviewer'.",
  subagent_type: "tester", name: "tester", run_in_background: true })
Agent({ prompt: "Wait for 'tester'. Review code quality and security.",
  subagent_type: "reviewer", name: "reviewer", run_in_background: true })

// Kick off the pipeline
SendMessage({ to: "researcher", summary: "Start", message: "[task context]" })
```

### Patterns

| Pattern | Flow | Use When |
|---------|------|----------|
| **Pipeline** | A → B → C → D | Sequential dependencies (feature dev) |
| **Fan-out** | Lead → A, B, C → Lead | Independent parallel work (research) |
| **Supervisor** | Lead ↔ workers | Ongoing coordination (complex refactor) |

### Rules

- ALWAYS name agents — `name: "role"` makes them addressable
- ALWAYS include comms instructions in prompts — who to message, what to send
- Spawn ALL agents in ONE message with `run_in_background: true`
- After spawning, continue independent local work; wait only when a dependency
  genuinely blocks progress
- Do not poll repeatedly — agents message back or complete automatically
- Give every writing agent an isolated worktree and a non-overlapping file scope

## Swarm & Routing

### Config
- **Topology**: mesh
- **Max Agents**: 5
- **Memory**: memory (simple, sin HNSW)
- **HNSW**: Disabled
- **Neural**: Disabled

Config alineada a la `proven-config.json` ya validada en el proyecto `portalFac` (misma política adoptada, mismo `championId`) — no al default agresivo que deja `ruflo init` de fábrica.

```bash
npx @claude-flow/cli@latest swarm init --topology mesh --max-agents 5 --strategy specialized
```

### Agent Routing

| Task | Agents | Topology |
|------|--------|----------|
| Bug Fix | researcher, coder, tester | hierarchical |
| Feature | architect, coder, tester, reviewer | hierarchical |
| Refactor | architect, coder, reviewer | hierarchical |
| Performance | perf-engineer, coder | hierarchical |
| Security | security-architect, auditor | hierarchical |

### When to Swarm
- **YES**: 3+ files, new features, cross-module refactoring, API changes, security, performance
- **NO**: single file edits, 1-2 line fixes, docs updates, config changes, questions

### 3-Tier Model Routing

| Tier | Handler | Use Cases |
|------|---------|-----------|
| 1 | Agent Booster (WASM) | Simple transforms — skip LLM, use Edit directly |
| 2 | Haiku | Simple tasks, low complexity |
| 3 | Sonnet/Opus | Architecture, security, complex reasoning |

## Memory & Learning

### Before Any Task
```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### After Success
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

### MCP Tools (use `ToolSearch("keyword")` to discover)

| Category | Key Tools |
|----------|-----------|
| **Memory** | `memory_store`, `memory_search`, `memory_search_unified` |
| **Bridge** | `memory_import_claude`, `memory_bridge_status` |
| **Swarm** | `swarm_init`, `swarm_status`, `swarm_health` |
| **Agents** | `agent_spawn`, `agent_list`, `agent_status` |
| **Hooks** | `hooks_route`, `hooks_post-task`, `hooks_worker-dispatch` |
| **Security** | `aidefence_scan`, `aidefence_is_safe`, `aidefence_has_pii` |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_consensus`, `hive-mind_spawn` |

### Background Workers

| Worker | When |
|--------|------|
| `audit` | After security changes |
| `optimize` | After performance work |
| `testgaps` | After adding features |
| `map` | Every 5+ file changes |
| `document` | After API changes |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```

## Agents

**Core**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
**Architecture**: `system-architect`, `backend-dev`, `mobile-dev`
**Security**: `security-architect`, `security-auditor`
**Performance**: `performance-engineer`, `perf-analyzer`
**Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`
**GitHub**: `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string works as a custom agent type.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```

## CLI Quick Reference

```bash
npx @claude-flow/cli@latest init --wizard           # Setup
npx @claude-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @claude-flow/cli@latest memory search --query "" # Vector search
npx @claude-flow/cli@latest hooks route --task ""    # Route to agent
npx @claude-flow/cli@latest doctor --fix             # Diagnostics
npx @claude-flow/cli@latest security scan            # Security scan
npx @claude-flow/cli@latest performance benchmark    # Benchmarks
```

26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
claude mcp add claude-flow -- npx -y ruflo@latest mcp start
npx ruflo@latest doctor --fix
```

> The background `daemon` is optional. It runs interval workers that each spawn
> a headless `claude` session, so it consumes tokens continuously. Start it only
> if you want those sweeps: `npx ruflo@latest daemon start` (self-stops after 12h
> by default; `--ttl 0` to disable, `daemon status --all` to audit running daemons).

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.
