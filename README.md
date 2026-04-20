# Distributed Rate Limiter REST API

A production-grade distributed rate limiting service built with Node.js, Express, PostgreSQL, and Redis. Protects APIs from abuse by enforcing request limits per user and IP address across multiple algorithms.

![Dashboard](dashboard/src/assets/hero.png)

## Live Features

- Four rate limiting algorithms selectable per endpoint
- Per-user and per-IP rate limiting with API key authentication
- Redis atomic counters — zero race conditions under concurrent load
- PostgreSQL persistence for users, API keys, configs, and request logs
- Real-time metrics and monitoring endpoints
- React dashboard with live charts
- Full Docker containerization — runs with one command
- Swagger/OpenAPI interactive documentation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | PostgreSQL 15 |
| Cache / Counters | Redis 7 |
| Frontend | React + Recharts |
| Containerization | Docker + Docker Compose |
| Documentation | Swagger / OpenAPI 3.0 |

## Rate Limiting Algorithms

### Fixed Window
Divides time into fixed windows. Simple and fast. Has a boundary exploit where users can double their limit across window boundaries.

### Sliding Window
Uses a Redis sorted set to track exact request timestamps in a rolling window. More accurate than Fixed Window — no exploitable boundary.

### Token Bucket
Tokens accumulate while the user is idle and are consumed per request. Allows bursting. Used by Stripe and AWS API Gateway in production.

### Leaky Bucket
Output rate is always constant regardless of input. Drops requests when the bucket is full. Used in payment systems where steady throughput matters.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/distributed-rate-limiter.git
cd distributed-rate-limiter

# Start the entire stack
docker-compose up --build
```

The API will be available at `http://localhost:3000`

### Run Locally

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Start the server
npm run dev
```

### Run the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`

## API Documentation

Interactive Swagger documentation available at: