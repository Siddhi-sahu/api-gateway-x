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
       │                 │
       │ Authentication  │
       │                 │
       └────────┬────────┘
                │
          ┌─────┴──────┐
          ▼            ▼
       User          Product

Step 2: After redis:

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

Step 3: after postgresql:

             CLIENT
                │
                ▼
       ┌─────────────────────┐
       │       GATEWAY       │
       │                     │
       │ Auth                │
       │ Rate Limit → Redis  │
       │ Routing             │
       │ Logging             │
       └───────┬───────┬─────┘
               │       │
               ▼       ▼
             User    Product
               
                 │
                 ▼
             PostgreSQL
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