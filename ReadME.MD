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



Step 2: after postgresql:

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
             
Step 3: After redis:

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