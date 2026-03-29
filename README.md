# 🛍️ Smart Fashion AI

> Website bán quần áo tích hợp 4 tính năng AI — Chatbot tư vấn, AI Search, Recommendation, Behavior Analysis.

---

## 🏗️ Kiến Trúc

```
                            ┌──────────────────┐
                            │     Nginx        │
                            │   (Reverse Proxy)│
                            └──────┬───────────┘
                     ┌─────────────┼─────────────┐
                     ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ Frontend │  │ Backend  │  │    AI    │
              │ Next.js  │  │ NestJS   │  │ FastAPI  │
              │  :3000   │  │  :4000   │  │  :8000   │
              └──────────┘  └────┬─────┘  └────┬─────┘
                                 │             │
                     ┌───────────┼─────────────┤
                     ▼           ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │PostgreSQL│  │  Redis   │  │ RabbitMQ │
              │+pgvector │  │  7.x     │  │  3.13    │
              │  :5432   │  │  :6379   │  │  :5672   │
              └──────────┘  └──────────┘  └──────────┘
```

## ⚡ Quick Start

### Yêu cầu
- **Docker Desktop** (đã cài và chạy)
- **Node.js 20 LTS** + npm 10+
- **Python 3.12**

### 1. Clone & Setup

```bash
# Clone repository
git clone <repo-url>
cd smart-fashion-ai

# Copy env files
cp docker/.env.example docker/.env

# Khởi động infrastructure
npm run docker:up
```

### 2. Chạy từng service

```bash
# Backend (NestJS)
cd backend && npm install && npm run start:dev

# Frontend (Next.js)
cd frontend && npm install && npm run dev

# AI Service (FastAPI)
cd ai-service && python -m venv venv && pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000
```

### 3. Truy cập

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api/v1 |
| Swagger Docs | http://localhost:4000/api/docs |
| AI Service | http://localhost:8000/docs |
| RabbitMQ UI | http://localhost:15672 |

## 📂 Cấu Trúc Dự Án

```
smart-fashion-ai/
├── docker/           ← Docker Compose configs
├── scripts/          ← Automation scripts
├── shared/           ← Shared TS types, constants, validators
├── uploads/          ← File uploads (dev)
├── nginx/            ← Reverse proxy config
├── backend/          ← NestJS 11 (TypeScript)
├── frontend/         ← Next.js 15 (App Router)
└── ai-service/       ← FastAPI (Python 3.12)
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | NestJS 11, Prisma 6, JWT RS256, BullMQ |
| AI Service | FastAPI, LangChain, Gemini API, pgvector |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis 7.x |
| Message Broker | RabbitMQ 3.13 |
| Container | Docker Compose |

## 🤖 AI Features

1. **AI Chatbot** — Tư vấn thời trang qua chat (LangGraph + Gemini)
2. **AI Search** — Tìm kiếm thông minh (NLP + Vector Search)
3. **Recommendation** — Gợi ý sản phẩm cá nhân hóa (Hybrid ML)
4. **Behavior Analysis** — Phân tích hành vi người dùng

## 📝 Scripts

```bash
npm run docker:up      # Khởi động PostgreSQL, Redis, RabbitMQ
npm run docker:down    # Tắt infrastructure
npm run docker:logs    # Xem logs
npm run docker:reset   # Reset data (xóa volume)
npm run dev:backend    # Chạy backend dev
npm run dev:frontend   # Chạy frontend dev
npm run dev:ai         # Chạy AI service dev
```

---

*Built with ❤️ by Smart Fashion AI Team*
