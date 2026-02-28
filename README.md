# 🔬 LoadLens

> A full-stack load testing platform that simulates concurrent HTTP traffic and streams live latency metrics to a browser dashboard in real time.

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-green?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## What It Does

You give LoadLens a target URL, number of virtual users, and a duration. It fires concurrent HTTP requests, aggregates latency in real time, and streams live metrics — p50/p95 latency, requests per second, error rate — directly to your browser as the test runs. Results are saved permanently so you can compare any two runs side by side.

---

## Screenshots

> _Add your dashboard screenshot here_

---

## Features

- **Live Dashboard** — p50/p95 latency and RPS chart updates every second over WebSocket
- **Virtual User Simulation** — Java 21 Virtual Threads handle 500+ concurrent users on a laptop
- **Run History** — every test result saved to PostgreSQL, accessible any time
- **Run Comparison** — overlay two runs on one chart to spot regressions instantly
- **State Machine Lifecycle** — runs go through CREATED → RUNNING → DRAINING → COMPLETED / ABORTED
- **Auth** — Google OAuth2 login + manual email/password, JWT-secured API
- **One-command setup** — Docker Compose starts everything

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.2, Java 21, Spring Security, WebFlux WebClient |
| Frontend | React 18, Vite, Recharts, STOMP WebSocket |
| Database | PostgreSQL 15 |
| Cache / Messaging | Redis 7 |
| Auth | Spring OAuth2 + JWT (jjwt) |
| Infrastructure | Docker + Docker Compose |

---

## Getting Started

### Prerequisites

- Docker + Docker Compose installed
- A Google OAuth2 Client ID and Secret ([create one here](https://console.cloud.google.com/))

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/loadlens.git
cd loadlens
```

### 2. Set environment variables

Create a `.env` file in the root:

```env
POSTGRES_USER=loadlens
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=loadlens

REDIS_PASSWORD=yourredispassword

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

JWT_SECRET=a-long-random-secret-string-at-least-32-chars
```

### 3. Start everything

```bash
docker-compose up --build
```

That's it. Four services start: PostgreSQL, Redis, Spring Boot backend, React frontend.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| API Docs (Swagger) | http://localhost:8080/swagger-ui.html |

---

## How to Run a Load Test

1. Log in with Google or register with email/password
2. Click **New Plan** — enter a target URL, virtual users, duration
3. Hit **Run** — watch the live chart draw itself
4. When done, go to **History** to see all past runs
5. Select any two runs and hit **Compare**

> **Note:** Test against servers you own or control. For safe local testing, use the included mock target server — it has `/fast`, `/slow`, `/flaky`, and `/variable` endpoints.

---

## Mock Target Server

A companion Spring Boot app lives in `/mock-server`. Start it separately:

```bash
cd mock-server
mvn spring-boot:run
```

Then point your LoadLens test plan at `http://localhost:9090/slow` or any of these endpoints:

| Endpoint | Behaviour |
|---|---|
| `/fast` | Responds in ~10ms |
| `/slow` | Responds in ~500ms |
| `/variable` | Random 50–800ms response |
| `/flaky` | 20% chance of 500 error |

---

## Project Structure

```
loadlens/
├── backend/                  # Spring Boot application
│   └── src/main/java/
│       ├── domain/           # Entities, enums, DTOs
│       ├── service/          # LoadTestExecutor, MetricAggregator, JwtService
│       ├── controller/       # REST controllers, WebSocket config
│       └── repository/       # Spring Data JPA repositories
├── frontend/                 # React + Vite application
│   └── src/
│       ├── pages/            # Login, Dashboard, History, Compare
│       ├── components/       # LiveChart, MetricCard, RunTable
│       └── hooks/            # useWebSocket, useAuth
├── mock-server/              # Companion test target server
├── docker-compose.yml
└── README.md
```

---

## Architecture

```
React (browser)
    │  REST (plan CRUD, auth)
    │  WebSocket (live metrics)
    ▼
Spring Boot (backend)
    ├── LoadTestExecutor  ← Java 21 Virtual Threads
    ├── MetricAggregator  ← sliding window, atomic buffer swap
    ├── MetricBroadcaster ← @Scheduled every 1s → WebSocket push
    └── RunStatus FSM     ← CREATED → RUNNING → COMPLETED
    │
    ├── PostgreSQL  ← test plans, run results, users
    └── Redis       ← active run state, pub/sub
```

---

## Engineering Highlights

**Java 21 Virtual Threads** — 500 concurrent users = 500 virtual threads. Unlike OS threads (~1MB stack each), virtual threads park cheaply on I/O and are managed by the JVM. One line: `Executors.newVirtualThreadPerTaskExecutor()`.

**Atomic buffer swap** — metric writer threads dump latency values into a live buffer. Every second, the aggregator atomically replaces the buffer with a fresh one and computes percentiles on the snapshot. Zero data loss, zero write contention.

**State machine enforcement** — `RunStatus` transitions are validated in the service layer. You cannot start an already-running test or complete one that was never started. Invalid states are rejected at submission time, not at runtime.

**Stateless auth** — JWT tokens are verified on every request by a Spring Security filter without a database lookup. The token carries the user id and expiry — the server needs nothing else.

---

## Roadmap

- [ ] Distributed worker nodes via Redis task queue
- [ ] T-Digest for statistically correct percentile merging
- [ ] Scheduled runs with cron expressions
- [ ] CI/CD integration — fail pipeline if p95 exceeds threshold
- [ ] Prometheus + Grafana export
- [ ] gRPC and WebSocket protocol support

---

## License

MIT — do whatever you want with it.

---

_Built as a final year college project. Feedback and PRs welcome._
