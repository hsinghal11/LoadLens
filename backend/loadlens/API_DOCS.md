# LoadLens API Endpoints

This document outlines the available API endpoints for the LoadLens application and provides examples of how to test them using `curl` or tools like Postman.

## Base URL
The application runs on `http://localhost:8080` (as defined in `application-dev.properties`).

---

## Step-by-Step Load Testing Workflow
To run a successful load test, you must follow these steps in order:

1. **Authenticate:** Get a JWT Token via Login/Registration.
2. **Create Plan:** Create a new Test Plan outlining your target URL, Virtual Users, etc.
3. **Start Run:** Execute the test plan.
4. **Listen (WebSocket):** Connect to the WebSocket stream to receive live `MetricSnapshot` updates every second while the test runs.
5. **View Results:** Fetch the final saved `RunResult` from the database.

---

## Authentication Endpoints

### 1. User Registration
Registers a new user in the system.

- **URL:** `/api/v1/user/register`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body Example:**
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "securepassword123",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/user/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "johndoe@example.com", "password": "securepassword123", "avatarUrl": "https://example.com/avatar.jpg"}'
```

**Expected Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "johndoe@example.com",
    "enabled": true,
    "provider": "LOCAL",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2024-03-05T18:00:00Z"
  }
}
```

---

### 2. User Login
Authenticates an existing user and returns a JWT token.

- **URL:** `/api/v1/user/login`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body Example:**
```json
{
  "email": "johndoe@example.com",
  "password": "securepassword123"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "johndoe@example.com", "password": "securepassword123"}'
```

**Expected Response (202 Accepted):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "johndoe@example.com",
    "enabled": true,
    "provider": "LOCAL",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2024-03-05T18:00:00Z"
  }
}
```

---

### 3. Get Current User (Me)
Fetches the details of the currently authenticated user based on the provided JWT token.

- **URL:** `/api/v1/user/me`
- **Method:** `GET`
- **Authorization:** `Bearer <token>`

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "johndoe@example.com",
  "enabled": true,
  "provider": "LOCAL",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-03-05T18:00:00Z"
}
```

---

## OAuth2 Endpoints
These endpoints initiate the OAuth2 login flow. The frontend should redirect the user's browser to these URLs.
- **Google Login:** `http://localhost:8080/oauth2/authorization/google`
- **GitHub Login:** `http://localhost:8080/oauth2/authorization/github`

After authentication, the backend redirects to the frontend URL (configured as `FRONT_END_SUCCESS_REDIRECT` / `FRONT_END_FAILURE_REDIRECT`) passing the JWT token via query params. Example: `http://localhost:5173/oauth/success?token=eyJhbGci...`

---

## Test Plan Endpoints
Endpoints to manage load test configurations. All requests require a valid JWT token in the `Authorization: Bearer <token>` header.

### 4. Create a Test Plan
- **URL:** `/api/plans`
- **Method:** `POST`

**Request Body Example:**
```json
{
  "name": "High Traffic Stress Test",
  "targetUrl": "https://example.com/api/data",
  "virtualUsers": 100,
  "durationSeconds": 60,
  "rampUpSeconds": 15
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "name": "High Traffic Stress Test",
  "targetUrl": "https://example.com/api/data",
  "virtualUsers": 100,
  "durationSeconds": 60,
  "rampUpSeconds": 15,
  "status": "CREATED",
  "createdAt": "2024-03-05T18:00:00Z",
  "updatedAt": "2024-03-05T18:00:00Z"
}
```

---

### 5. Get User's Test Plans
- **URL:** `/api/plans`
- **Method:** `GET`

**Expected Response (200 OK):** *(Returns a List of TestPlanResponse objects belonging to the authenticated user)*

---

### 6. Get Plan by ID
- **URL:** `/api/plans/{id}`
- **Method:** `GET`

---

### 7. Update a Test Plan
- **URL:** `/api/plans/{id}`
- **Method:** `PUT`

**Request Body Example:** (Requires the same structure as Create request)
```json
{
  "name": "Updated Stress Test",
  "targetUrl": "https://example.com/api/data",
  "virtualUsers": 200,
  "durationSeconds": 120,
  "rampUpSeconds": 30
}
```

---

### 8. Delete a Test Plan
- **URL:** `/api/plans/{id}`
- **Method:** `DELETE`
*(Returns 204 No Content)*

---

## Load Test Execution Endpoints

### 9. Start a Load Test Run
Triggers the background virtual-thread executor to run the test.
- **URL:** `/api/plans/{id}/run`
- **Method:** `POST`

**Expected Response (202 Accepted):**
```json
{
  "message": "Run started successfully",
  "planId": "1",
  "status": "ACCEPTED"
}
```

### 10. Abort a Load Test Run
Stops a currently active load test.
- **URL:** `/api/plans/{id}/run`
- **Method:** `DELETE`

**Expected Response (200 OK):**
```json
{
  "message": "Run aborted",
  "status": "ABORTED"
}
```

---

## Metric WebSocket Stream (Live Data)

While a Load Test is running, the backend broadcasts live metric aggregations every second via WebSockets (STOMP protocol). 

1. **Connect to WebSocket endpoint:** `ws://localhost:8080/ws` (SockJS fallback available)
2. **Subscribe to Topic:** `/topic/metrics/{planId}`
3. **Incoming Payload Example (Sent every 1000ms):**
```json
{
  "planId": 1,
  "timestamp": "2024-03-05T18:10:05Z",
  "p50": 34.5,
  "p95": 112.4,
  "requestsPerSecond": 450,
  "errorRate": 2.5,
  "activeVirtualUsers": 100
}
```
*When the test finishes, the server will send a final status payload like `{"status": "COMPLETED", "planId": 1}` or `{"status": "FAILED", "planId": 1}`.*

---

## Run Result & Comparison Endpoints

After a run is COMPLETED, the aggregated test results are saved to PostgreSQL permanently.

### 11. Get All Results for a Plan
- **URL:** `/api/runs/plan/{planId}`
- **Method:** `GET`

*(Returns a list of `RunResultResponse` objects detailing historical tests for that plan)*

### 12. Get Specific Run Result
- **URL:** `/api/runs/{runId}`
- **Method:** `GET`

**Expected Response (200 OK):**
```json
{
  "id": 42,
  "startedAt": "2024-03-05T18:10:00Z",
  "completedAt": "2024-03-05T18:11:00Z",
  "totalRequests": 27000,
  "errorCount": 0,
  "p50Latency": 45.2,
  "p95Latency": 105.8,
  "avgRps": 450.0,
  "errorRate": 0.0,
  "durationSeconds": 60
}
```

### 13. Compare Two Runs
Compare a previous load test against a newer one to analyze performance degradation or improvement.
- **URL:** `/api/runs/compare?run1={id}&run2={id}`
- **Method:** `GET`

**Expected Response (200 OK):**
```json
{
  "runA": { /* Previous RunResultResponse Object */ },
  "runB": { /* Newer RunResultResponse Object */ },
  "delta": {
    "p95": -12.4,     // Negative means latency improved!
    "p50": -5.1,
    "rps": 50.0,      // Positive means throughput increased!
    "errorRate": 0.0
  }
}
```

---

## Global Error Responses

Any validation, authorization, or internal errors will consistently return this JSON structure globally:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable exact reason",
  "timestamp": "2024-03-05T18:00:00Z",
  "path": "/api/plans/99"
}
```
