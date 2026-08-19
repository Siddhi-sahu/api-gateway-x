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

                