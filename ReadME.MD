                    ┌─────────────────┐
                    │     CLIENT      │
                    │     React       │
                    └────────┬────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    API  GATEWAY     │
                  │                     │
                  │ Authentication      │
                  │ Rate limiting       │
                  │ Request logging     │
                  │ Routing             │
                  │ Caching             │
                  │ Retry / timeout     │
                  └──────────┬──────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
          User Service   Product API   Payment API
             :3001          :3002         :3003




                React
                │
                │ HTTP request
                ▼
                Api-gateway-x
                │
                │ inspect
                │ authenticate
                │ rate-limit
                │ log
                │ route
                ▼
                Backend Service
                │
                ▼
                Response
                │
                ▼
                Api-gateway-x
                │
                ▼
                React

                
Implementation Steps:

Step 1: 
             CLIENT
                │
                ▼
       ┌─────────────────┐
       │     GATEWAY     │
       │                 │ (Edge Auth Pattern)
       │ Authentication  │
       │                 │
       └────────┬────────┘
                │
          ┌─────┴──────┐
          ▼            ▼
       User          Product

Currently all auth in gateway, rather than auth as a separate service:

       CLIENT                     API GATEWAY (:3000)                USER SERVICE(:3001)
  │                                 │                                  │
  │ 1. POST /api/auth/login ───────>│ (Checks Postgres, signs JWT)     │
  │ <─── Returns JWT Token ─────────│                                  │
  │                                 │                                  │
  │ 2. GET /api/users (with JWT) ──>│ [Auth Middleware]                │
  │                                 │  - Decodes & Verifies JWT        │
  │                                 │  - Attaches X-User-Id header    │
  │                                 │  - Proxies request ─────────────>│
  │                                 │                                  │  (Reads X-User-Id,
  │                                 │<─ Returns User Data ─────────────│   returns data)
  │<──── Returns JSON Response ─────│                                  │


# Authentication:

             CLIENT
                │
                ▼
       ┌─────────────────────┐
       │       GATEWAY       │
       │                     │
       │ Auth                │
       │                     │
       └───────┬───────┬─────┘
               │       │
               ▼       ▼
             User    Product
               
                 │
                 ▼
             PostgreSQL

iteration:

             CURRENT
               │
               ▼
               Fix service ownership
               │
               ▼
               User Service gets its own DB
               Product Service gets its own DB
               │
               ▼
               Improve authentication architecture
               │
               ▼
               Secure Gateway → Service communication
               │
               ▼
               Reliability
               │
               ├── timeout
               ├── retries
               ├── idempotency
               └── circuit breaker

Revised architecture:

                  GATEWAY
                      │
       ┌──────────────┼───────────────┐
       │              │               │
     Auth           Rate            Routing
     proxy          limit             │
       │              │          ┌────┴────┐
       ▼              ▼          ▼         ▼
 User Service      Redis       User     Product
       │                         │          │
       ▼                         ▼          ▼
    User DB                     User DB.   Product DB

trust service boundary for user service, iteration #2:

                         CLIENT
                            │
                            │ JWT
                            ▼
                     ┌──────────────┐
                     │   GATEWAY    │
                     │              │
                     │ Verify JWT   │
                     │ Rate Limit   │
                     │ Route        │
                     └──────┬───────┘
                            │
                  X-Service-Key
                  X-User-Id
                            │
                            ▼
                     ┌──────────────┐
                     │ USER SERVICE │
                     │              │
                     │ Verify       │
                     │ Service Key  │
                     │              │
                     │ User Logic   │
                     └──────┬───────┘
                            │
                            ▼
                         USER DB

After redis:

             CLIENT
                │
                ▼
       ┌─────────────────────┐
       │       GATEWAY       │
       │                     │
       │ Authentication      │
       │ Rate Limiting ──────┼──→ Redis
       │ Routing             │
       │ Logging             │
       └──────────┬──────────┘
                  │
             ┌────┴─────┐
             ▼          ▼
          User       Product

Final:       

                       API GATEWAY
                            │
             ┌──────────────┼──────────────┐
             │              │              │
      Authentication   Rate Limiting    Logging
             │              │              │
             └──────────────┼──────────────┘
                            │
                         Routing
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
          User Service  Product Service Payment Service
              │             │              │
              └─────────────┼──────────────┘
                            │
                         Response
                            │
                            ▼
                          Client

# Retry And Circuit Breaker:
                         Gateway
                            │
                            ▼
                   Circuit Breaker
                            │
                       CLOSED?
                       /      \
                     yes       no
                      │         │
                      ▼         ▼
                    Retry    503 immediately
                      │
                ┌─────┴─────┐
                │           │
             Axios       failure
                │           │
           timeout=3s       │
                │           │
                ▼           ▼
           User Service   retry?
                            │
                       yes → backoff
                            │
                            ▼
                         Axios again

TODO:
1. middleware that validates the service key.✅
2. Relability - 1. timeouts
                2. error propagation/translation
                3. retry
                4. exponential backoff
                5. circuit breaker
                6. idempotency
3. remove code/package duplication (eg. middleware in both user and product service.)
4. implement retry and circuit logic across all relevant routes
5. add configuration for numbers scattered through the code base.
6. fix retry