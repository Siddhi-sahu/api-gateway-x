the request pipeline rn:

Client
  ↓
Gateway
  ↓
Rate limiting
  ↓
Authentication
  ↓
Routing
  ↓
Service-to-service authentication
  ↓
User Service
  ↓
Database
  ↓
User Service
  ↓
Gateway
  ↓
Client