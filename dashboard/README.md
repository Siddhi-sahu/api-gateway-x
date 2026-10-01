# API Gateway X — Control Plane Dashboard

A read-only operations console for the API gateway in `../gateway`. It polls
four observability endpoints every 5 seconds and shows how the gateway is
behaving: health of each dependency, traffic, caching, rate limiting, retries,
circuit breakers, and the most recent requests with their request IDs.

The dashboard **never invents data**. Every value on screen carries one of three tags:

| Tag | Meaning |
|---|---|
| `[LIVE /endpoint]` | Returned by that gateway endpoint as-is. |
| `[CLIENT-DERIVED]` | Calculated in the browser from live data (a rate, a ratio, a history). |
| `[STATIC]` | Copied from gateway source code because no endpoint exposes it (e.g. the rate limit of 500/60s). |

---

## 1. Frontend at a glance

```
 main.tsx ─► App.tsx ─► Dashboard.tsx  (owns ALL state, runs the poll loop)
                            │
       every 5 s            │  Promise.allSettled([...])
       ┌────────────────────┼──────────────────────────┬────────────────────────┐
       ▼                    ▼                          ▼                        ▼
  getMetrics()       getHealthTimed()          getRecentRequests()     getCircuitBreakers()
  GET /metrics       GET /health (+RTT)        GET /recent-requests    GET /circuit-breakers
       │                    │                          │                        │
       ▼                    ▼                          ▼                        ▼
  metrics +            health +                  recentRequests          circuitBreakers +
  metricsSamples[]     healthSamples[]                                   transitions[]
  (last 61)            (last 60)                                         (last 20 changes)
       │                    │                          │                        │
       └───────► lib/derive.ts (pure maths: ticks, rates, uptime, diffs) ◄──────┘
                            │
                            ▼
   Header · SystemStatus · MetricsPanel · OperationsPanel · RoutingTable · RequestStream · Footer
                            ▲
                 lib/gatewayConfig.ts (STATIC values from gateway source)
```

**Stack:** React 19, TypeScript and Vite. There are no UI, chart or state libraries. Styling is one plain CSS file, and the only font is JetBrains Mono.

**Data flow in one sentence:** `api.ts` fetches, `Dashboard.tsx` stores the latest response of each endpoint plus a small in-memory history, `derive.ts` turns that into numbers, and the components only render.

| File | Responsibility |
|---|---|
| `src/lib/api.ts` | One function per gateway endpoint. `getHealthTimed` also measures round-trip time. |
| `src/types/index.ts` | Types that mirror the gateway JSON exactly, plus client-only types (`Tick`, `HealthSample`, …). |
| `src/lib/derive.ts` | All calculations: pure functions with no React in them. |
| `src/lib/gatewayConfig.ts` | Static config copied from gateway source, with file references. |
| `components/Dashboard.tsx` | Poll loop, error flags, history buffers, layout. |
| `components/Header.tsx` | Overall state (OPERATIONAL / DEGRADED / UNREACHABLE), target, poll interval, last sync. |
| `components/SystemStatus.tsx` | Dependency health matrix. |
| `components/MetricsPanel.tsx` | Traffic counters, throughput strip, cache subsystem. |
| `components/OperationsPanel.tsx` | Redis, rate limiter, retries, circuit breakers, observed state changes. |
| `components/RoutingTable.tsx` | Request path through the middleware, with live readings per stage and the route table. |
| `components/RequestStream.tsx` | Last 10 requests as log lines. Click a request ID to copy it. |
| `components/Footer.tsx` | Whether each endpoint answered on the last poll, and buffer fill. |
| `components/ui.tsx` | Shared pieces: `Panel`, `Tag`, `EmptyState`, `Readout`. |

**Failure behaviour:**
- Each endpoint is independent (`Promise.allSettled`), so one failing endpoint doesn't blank the others.
- The last good response is kept. The failing panel says *UNAVAILABLE*, and the footer shows `ERR` for that endpoint.
- When `/health` fails, downstream statuses show **UNKNOWN**, not the last known value. The gateway can't be asked, so we don't pretend to know.

### How to explain this project in 2 minutes

1. **The gateway sits in front of two services** (user :3001, product :3002).
   - Every request gets a request ID and is logged and counted.
   - It is then rate-limited in Redis and routed.
   - `GET /api/products` is cached in Redis for 60 s.
   - Calls to services are wrapped in retry (3 attempts, exponential backoff) inside a circuit breaker (opens after 3 failures, tries again after 10 s).
2. **The gateway exposes four observability endpoints:** `/health`, `/metrics`, `/recent-requests` and `/circuit-breakers`.
3. **The dashboard polls them every 5 s.** It keeps a 5-minute rolling history in the browser to turn cumulative counters into rates, a throughput chart and "session uptime".
4. **Every number is labeled by origin** (live, client-derived or static). The UI also states the known caveats: dashboard polling counts as traffic, and "retries" counts every attempt.
5. **Try it:**
   - Stop product-service and hit `/api/products` 3 times. Product service goes UNHEALTHY and its breaker goes `[ OPEN ]`, and the state change is logged.
   - Restart it. The next request after 10 s closes the breaker again.

---

## 2. Running it

```bash
# infrastructure (Postgres ×3, Redis)
docker compose up -d            # from repo root

# backend: in gateway/, services/user-service/, services/product-service/
npm start

# dashboard
cd dashboard
npm install
npm run dev                     # http://localhost:5173
```

The gateway address is set in `src/lib/api.ts` (`API_URL = "http://localhost:3000"`).
The gateway enables CORS for all origins, so no proxy is needed.

---

## 3. Endpoint → data → component

| Endpoint | Response (exact gateway shape) | Used by |
|---|---|---|
| `GET /health` | `{ gateway, redis, services: { userService, productService } }`, each `"healthy" \| "unhealthy"`. Always HTTP 200. | Header, SystemStatus, OperationsPanel (Redis), RoutingTable (services stage) |
| `GET /metrics` | `{ requestsTotal, requestsFailed, cacheHits, cacheMisses, retries, rateLimitRejected, totalLatencyMs }`. Cumulative since gateway start, in-memory. | MetricsPanel, OperationsPanel, RoutingTable |
| `GET /recent-requests` | Array (max 10, newest first) of `{ requestId, method, route, statusCode, durationMs, timestamp }` | RequestStream |
| `GET /circuit-breakers` | `{ userService, productService }`, each `"CLOSED" \| "OPEN" \| "HALF_OPEN"` | OperationsPanel, RoutingTable |

Where the gateway builds each response:
- **`/health`:** `gateway/src/controllers/health.controller.ts`
  - Redis is checked with `PING` (healthy if the reply is `PONG`).
  - Each service is checked with `GET <service>/health` (3 s timeout).
  - `gateway` is hard-coded `"healthy"`: if it answers at all, it's up.
- **`/metrics`:** `gateway/src/utils/metrics.ts`, updated in `middlewares/requestLogger.ts` when each response finishes.
- **`/recent-requests`:** `gateway/src/utils/requestRecord.ts` (ring of 10). The logger skips the four observability paths.
- **`/circuit-breakers`:** `gateway/src/server.ts:40-45`, which reads `getState()` of each `CircuitBreaker`.

---

## 4. Every value on screen and how it's calculated

Notation:
- `m` is the latest `/metrics` response.
- A **sample** is `{ at: Date.now(), metrics: m }`, stored on every successful poll.
- A **tick** is the difference between two consecutive samples.

### Header
| Value | Source | Calculation |
|---|---|---|
| OPERATIONAL / DEGRADED | LIVE `/health` | All four statuses `healthy` → OPERATIONAL. Any `unhealthy` → DEGRADED. |
| GATEWAY UNREACHABLE | client | The `/health` request itself failed (network error or non-2xx). |
| LAST SYNC | client | Time of the last poll where at least one endpoint answered. |

### Dependency health matrix (`SystemStatus`)
| Value | Source | Calculation |
|---|---|---|
| STATUS per row | LIVE `/health` | As returned. Shows UNREACHABLE (gateway) or UNKNOWN (others) if `/health` failed, and PENDING before the first reply. |
| PROBE RTT | CLIENT-DERIVED | `performance.now()` after the response minus before the request, in `getHealthTimed()`. It includes the gateway's own probes of Redis and both services, so it is the cost of the **whole** health check, **not** per-service latency. |
| N / 4 HEALTHY | LIVE | Count of `healthy` values. |
| SESSION UPTIME | CLIENT-DERIVED | `healthy polls / counted polls × 100` over the last 60 `/health` polls (`observedUptime()`). For the gateway row a failed poll counts as down. For other rows a failed poll is skipped, since their state is unknown. **Example:** 12 polls, product-service unhealthy in 3 → `9/12 = 75.0% of 12 polls`. |
| Responsibility / probe text | STATIC | Describes what each component does and how `/health` checks it. |

### Request metrics (`MetricsPanel`)
| Value | Source | Calculation |
|---|---|---|
| REQUESTS | LIVE | `m.requestsTotal` |
| +x req/s | CLIENT-DERIVED | `(last tick requests) / (tick interval in s)`. **Example:** 234 → 250 over 5.0 s = `16 / 5 = 3.2 req/s`. |
| SUCCESS RATE | CLIENT-DERIVED | `(requestsTotal − requestsFailed) / requestsTotal × 100`. The text gauge `[|||||···]` is the same number in 14 characters. |
| FAILED · 5XX | LIVE | `m.requestsFailed`. The gateway only counts **status ≥ 500** as failed, so 401/429 are *not* failures here. |
| % of total | CLIENT-DERIVED | `requestsFailed / requestsTotal × 100` |
| AVG LATENCY | CLIENT-DERIVED | `totalLatencyMs / requestsTotal`, the lifetime average. |
| window N ms | CLIENT-DERIVED | `Σ tick.latencyMs / Σ tick.requests` over the in-memory window (≤ 5 min). This reflects *recent* latency. |
| Throughput strip | CLIENT-DERIVED | One bar per tick: height = `tick.requests / max(tick.requests)` and the red cap = `tick.failed / tick.requests`. Empty hatched slots mean *no sample yet*, not zero traffic. Hover a bar for its values. |
| x req/s over y min | CLIENT-DERIVED | `Σ tick.requests / Σ tick.intervalMs` for the whole window. |
| HIT RATE | CLIENT-DERIVED | `cacheHits / (cacheHits + cacheMisses) × 100` |
| HITS / MISSES / LOOKUPS | LIVE (+ derived) | `m.cacheHits`, `m.cacheMisses` and their sum. "+N in window" is the sum of tick deltas. |
| COUNTERS RESET notice | CLIENT-DERIVED | If **any** counter goes down between two samples, the gateway restarted (counters live in memory). History is cleared so the rates don't go negative. |

### Gateway operations (`OperationsPanel`)
| Value | Source | Calculation |
|---|---|---|
| REDIS | LIVE `/health` | `health.redis` |
| RATE-LIMIT REJECTIONS · 429 | LIVE | `m.rateLimitRejected`. "+N last poll" is the latest tick's delta. |
| 500 req / 60s per client IP | STATIC | `ratelimiter.ts:9-10`. It's per IP because the limiter runs before auth, so `req.user` is not set yet. |
| DOWNSTREAM ATTEMPTS | LIVE | `m.retries`. Despite the name, the gateway increments it on **every** attempt, the first included (`retry.ts:37`). One healthy request adds 1, and a request that fails all 3 tries adds 3. |
| Breaker state `[ CLOSED ]` | LIVE `/circuit-breakers` | Green = CLOSED, amber = HALF_OPEN, red = OPEN. |
| 3 failures open · 10s to half-open | STATIC | `circuitBreaker.ts:81-82` |
| STATE CHANGES | CLIENT-DERIVED | `diffCircuits(previous, current)` on every poll. A change that opens and closes again between two polls (under 5 s) is **not** seen, which is why it's labeled "observed between polls". |
| BREAKERS OPEN n / 2 | CLIENT-DERIVED | Count of `OPEN` in the latest response. |

### Request path (`RoutingTable`)
The stage order and descriptions are STATIC (from `server.ts` and the controllers). The reading on each stage is CLIENT-DERIVED from the same window as above:

| Stage | Reading |
|---|---|
| requestLogger | `Σ tick.requests` (logged) |
| ratelimiter | `Σ tick.rateLimited` (× 429) |
| cache | `Σ tick.cacheHits` hit / `Σ tick.cacheMisses` miss |
| breaker | Current state of both breakers (LIVE) |
| retry | `Σ tick.attempts` |
| services | Service statuses from `/health` (LIVE) |

The route table lists the routes the gateway proxies and which protections each one has (cache, breaker, retry, JWT).

### Request trace (`RequestStream`)
Rows are exactly what `/recent-requests` returns. Formatting:
- **Time** is the local clock with milliseconds.
- **Status colour:** ≥ 500 red, ≥ 400 amber, otherwise green.
- **Latency colour:** ≥ 300 ms amber, ≥ 1000 ms red.
- **Request ID** is the first 8 characters. Click it to copy the full UUID.

Use the ID to find the matching `request_completed` JSON log line in the gateway's stdout.

---

## 5. Honesty notes (known caveats)

- **The dashboard counts as traffic.** Every poll sends 4 requests. `requestLogger` counts all of them in `requestsTotal` and `totalLatencyMs`. That adds about 0.8 req/s per open tab and pulls average latency toward the cost of `/health`. The dashboard's requests are *not* shown in `/recent-requests`, because the gateway filters them out.
- **The dashboard uses up rate-limit budget.** Its polls also pass the rate limiter: 48 requests/min per open tab, out of the 500/min per-IP budget it shares with your curl or test traffic from the same machine.
- **"retries" is really "attempts"**, as explained above. The label says DOWNSTREAM ATTEMPTS so it isn't misread.
- **A breaker only leaves OPEN when traffic arrives.** The gateway moves OPEN → HALF_OPEN lazily, on the first request after 10 s. With no traffic, `/circuit-breakers` keeps reporting OPEN indefinitely.
- **Health checks bypass the breakers.** `/health` calls the services directly, so a service can be HEALTHY while its breaker is still OPEN, until the next real request.
- **No response headers are read.** The gateway sets `X-Request-Id` and the rate-limit headers (`rate-limit`, `Requests-remaining`, `Rate-limit-reset`). CORS does not expose them to browsers, and there is no `X-Cache` header at all, so cache hits are only visible through the counters.
- **All history lives in browser memory.** Reloading the page clears uptime, the throughput strip and state changes.

## 6. What is intentionally *not* shown

| Not shown | Why |
|---|---|
| p95/p99 latency | The gateway only exposes a latency **sum**. Percentiles need per-request data, and `/recent-requests` holds only 10 rows. |
| Per-service latency | Not measured by the gateway. |
| Real uptime % | The gateway has no uptime counter. Only *session-observed* uptime is shown. |
| Rate-limit remaining for a client | Only in response headers, which CORS doesn't expose. |
| Cache TTL remaining / key list | No endpoint exposes them. |
| Throughput in KB/s | The gateway doesn't count bytes. |
| Log stream | The gateway logs to stdout only. The request trace uses the real `/recent-requests` buffer. |

---

## 7. Backend mechanisms (reference)

**Middleware order** (`gateway/src/server.ts:19-24`): `cors → express.json → requestId → requestLogger → ratelimiter → routes`.

**Request ID** (`middlewares/requestId.ts`):
- Uses the incoming `x-request-id` header, or generates `crypto.randomUUID()` if there isn't one.
- The ID is set on `req.requestId` and returned as the `X-Request-Id` response header.
- It is forwarded to services on proxied calls.

**Rate limiter** (`middlewares/ratelimiter.ts`):
- Fixed window per client IP, using `INCR rate-limit:<ip>` in Redis. The first hit sets `EXPIRE 60`.
- Above 500 requests it returns 429 and increments `rateLimitRejected`.
- If Redis errors, requests are let through (fail open).

**Cache** (`controllers/product.controller.ts`):
- `GET /api/products` reads `cache:products:all` first.
- **Hit:** increments `cacheHits` and returns `{ source: "cache", data }`.
- **Miss:** increments `cacheMisses`, fetches from product-service and stores the result with `EX 60`.
- `POST /api/products` does not invalidate the cache.

**Retry** (`utils/retry.ts`):
- Up to 3 attempts, each with a 3 s axios timeout.
- Waits 100 ms, then 200 ms between attempts.
- Retries only on network or timeout errors and on 502/503/504.

**Circuit breaker** (`utils/circuitBreaker.ts`), one per service, wraps the retry call. A request that fails all 3 attempts counts as **one** breaker failure.

```
          3 consecutive failures                 10 s passed and a request arrives
 CLOSED ─────────────────────────► OPEN ───────────────────────────────────────────► HALF_OPEN
   ▲                                │ ▲                                                  │
   │                                │ └──────────────── trial request fails ─────────────┤
   │                     fail fast (503/500)                                             │
   └──────────────────────────────── trial request succeeds ────────────────────────────┘
```
