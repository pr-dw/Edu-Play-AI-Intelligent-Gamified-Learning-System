# EduPlay AI — Gamified E-Learning Platform

An intelligent, web-based gamified e-learning platform featuring an AI Personal Tutor built with **LangChain**, supporting dynamic model switching between **local Ollama (Qwen 2.5: 3B)** and **Google Gemini API**, structured course progression, XP achievements, and verified certificate generation backed by **PostgreSQL**.

---

## 🌟 The 5 Core Modules

### 1. User Management Module (`users`)
- **Roles**: Only **`user`** (Learner) and **`admin`** (Administrator).
- **Authentication**: JWT token-based authentication (`rest_framework_simplejwt`) and session auth.
- **Gamification Mechanics**: XP points awarded for enrolling (+25 XP), completing lessons (+50–75 XP), course completion (+500–600 XP), asking questions to the AI Tutor (+5 XP), and claiming certificates (+200 XP).
- **Leaderboard**: Global rankings based on total earned XP.
- **1-Click Demo Profiles**: Instant testing available for Users (`sam` and `alex`) and Admin (`admin`).

### 2. Course Management Module (`courses`)
- **Curriculums & Categories**: Structured courses organized by categories (Artificial Intelligence, Full-Stack Web Dev, Data Science & Python) and difficulty levels (Beginner, Intermediate, Advanced).
- **Interactive Lessons**: Rich markdown lesson viewer with syntax highlighting and sequential progression (Next / Previous).
- **Progress Tracking**: Real-time course progress calculation (`progress_percentage`) and automatic completion triggers when all lessons are finished.
- **AI Context Integration**: Lessons provide structured learning materials that are fed directly as context to the AI Personal Tutor.

### 3. AI Personal Tutor Module (`tutor`)
- **Powered by LangChain**: Declarative prompt templates and chains utilizing `ChatPromptTemplate` and `StrOutputParser`.
- **Dynamic Provider Switcher**:
  - **🦙 Ollama (`qwen2.5:3b`)**: 100% private, local inference on machine (zero external cost, works offline).
  - **✨ Google Gemini API**: High-throughput frontier cloud LLM (`gemini-1.5-flash`), with optional user API key input.
- **5 Pedagogical Modes**:
  1. 💡 *Explain Concept*: Clear conceptual breakdowns using intuitive analogies.
  2. 📝 *Summarize*: Crisp bullet-point takeaways.
  3. 💻 *Code & Examples*: Practical implementation snippets with annotations.
  4. 🎯 *Quiz & Hints*: Socratic practice questions and conceptual clues.
  5. 💬 *Doubt Solver*: Step-by-step doubt resolution and debugging guidance.
- **Context Grounding**: Automatically ground queries in the user's active course and lesson material.
- **Conversation History**: Session tracking and multi-turn message history.

### 4. Certificate Management Module (`certificates`)
- **Automatic Eligibility Check**: Verifies 100% completion of course lessons before issuing.
- **Unique Credentials**: Generates unique Certificate IDs (e.g., `EDU-2026-XXXXXXXX`) and tamper-proof verification codes.
- **Interactive Credential Renderer**: Visual certificate frame with gold border, watermark seal, and recipient details.
- **Downloadable PDF**: Generated server-side using **ReportLab** (`/api/certificates/download/<cert_id>/`).
- **Public Verification**: Search by Certificate ID or Verification Code to confirm authenticity on the network.

### 5. Administration Module (`administration`)
- **Administrative Dashboard**: Metrics on total users (`users_count` and `admins_count`), courses, lesson counts, completion rates, and certificates issued.
- **AI Analytics**: Breakdown of AI Tutor queries (Ollama vs. Gemini).
- **User Management**: Promote or demote user roles (`user` or `admin`) and toggle active status.
- **Curriculum Controls**: Create new courses, toggle published/draft status.
- **System Settings**: Set the default platform AI provider (Ollama / Gemini) and announcement banners.
- **Database Seeder**: 1-Click seed / reset tool to populate demo courses and accounts.

---

## 🗄️ Database Configuration (PostgreSQL)

EduPlay AI runs on **PostgreSQL**:
- **Database**: `eduplay_db`
- **User**: `postgres`
- **Password**: `123456`
- **Host**: `127.0.0.1`
- **Port**: `5432`

Configured in `backend/.env` and [settings.py](file:///home/prdw/Desktop/Gamiefied%20e-learning%20platform/backend/eduplay_backend/settings.py).

---

## 🔑 Demo Accounts

Pre-configured accounts available via 1-click buttons in the UI:

| Role | Username | Password | Notes |
|---|---|---|---|
| **User** | `sam` | `user123` | Enrolled in LangChain masterclass with earned XP & certificate |
| **User** | `alex` | `user123` | Active user exploring React & Python curriculums |
| **Admin** | `admin` | `admin123` | Full access to Administration console & platform settings |

---

## 🚀 Running the Project

- **Frontend**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Backend API**: [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
