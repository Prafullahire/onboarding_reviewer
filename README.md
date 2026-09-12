# Multi-Agent Onboarding Case Reviewer

A full-stack TypeScript application where multiple specialised AI agents collaborate to review **synthetic banking onboarding cases** and produce consolidated, explainable recommendations.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

---

## Overview

This system simulates a **KYC/AML onboarding review pipeline** for banks. Four specialist agents analyse a customer case in sequence, a supervisor agent synthesises the findings, and a human reviewer approves or overrides the final decision.

> **All data is synthetic.** No real customer or banking information is used.

### Key Features

- Create, upload (JSON), or select pre-seeded onboarding cases
- Four specialist agents with typed inputs/outputs and defined responsibilities
- Custom workflow orchestrator with retry, timeout, and failure handling
- Two autonomy modes: **Human Approval Required** and **Exception Only Review**
- Full execution trace with structured agent outputs
- Human-in-the-loop decision panel (Approve / Reject / Refer / Override)
- MySQL persistence with audit log for compliance
- 17 automated unit tests

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                       │
│  Case Management │ Review Panel │ Execution Trace │ Approvals  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                   Node.js / Express Backend                       │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Case Service │  │ Review Service  │  │  Audit Service   │   │
│  └──────────────┘  └────────┬────────┘  └──────────────────┘   │
│                             │                                     │
│              ┌──────────────▼──────────────┐                     │
│              │   Workflow Orchestrator     │                     │
│              │  (Supervisor / Coordinator)   │                     │
│              └──────────────┬──────────────┘                     │
│                             │                                     │
│    ┌────────────┬───────────┼───────────┬────────────┐           │
│    ▼            ▼           ▼           ▼            │           │
│  Document    Identity    Risk        Recommendation   │           │
│  Completeness Consistency Indicator    Agent         │           │
│    Agent       Agent       Agent                      │           │
└────────────────────────────┬─────────────────────────┘           │
                             │                                     │
                    ┌────────▼────────┐                            │
                    │   MySQL 8.0     │                            │
                    │  Cases, Workflows, Audit Log                │
                    └─────────────────┘                            │
```

---

## Agent Responsibilities

| Agent | Goal | Output |
|-------|------|--------|
| **Document Completeness** | Verify required documents are present and verified | Completeness score, per-document findings |
| **Identity Consistency** | Cross-validate identity across profile, ID, and address | Consistency score, field-level checks |
| **Risk Indicator** | Assess AML/KYC risk factors (PEP, sanctions, etc.) | Risk score (0–100), severity-classified factors |
| **Recommendation** | Synthesise specialist outputs into a final decision | Approve / Reject / Refer with confidence and rationale |

### Workflow Sequence

```
Case Selected → Document Agent → Identity Agent → Risk Agent → Recommendation Agent → Human Gate → Final Decision
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL 8 |
| Validation | Zod |
| Testing | Vitest |
| Orchestration | Custom TypeScript supervisor |

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **npm** 9+
- **MySQL 8** (local install or Docker)

### 1. Clone the repository

```bash
git clone https://github.com/Prafullahire/onboarding_reviewer.git
cd onboarding_reviewer
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=onboarding_reviewer
```

### 4. Set up the database

**Option A — Local MySQL (recommended if no Docker):**

```bash
# Create database and user (run as MySQL root)
mysql -u root -p < backend/src/db/setup-local.sql

# Create tables and load sample data
cd backend && npm run db:migrate
```

**Option B — Docker:**

```bash
npm run db:up
# Wait ~15 seconds for MySQL to initialise
```

### 5. Start the application

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Health check | http://localhost:3001/api/health |

### 6. Run tests

```bash
cd backend && npm test
```

---

## Sample Test Cases

Upload these via the **Upload JSON** button in the UI (`data/samples/`):

| File | Scenario | Expected Result |
|------|----------|-----------------|
| `low-risk-case.json` | Complete application, no risk flags | **Approve** |
| `high-risk-case.json` | PEP, missing documents, adverse media | **Refer for Review** |
| `identity-inconsistency-case.json` | Name mismatch on ID document | **Refer for Review** |
| `test-upload-case.json` | Salaried employee, one unverified doc | **Approve** (mostly) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/cases` | List all cases |
| POST | `/api/cases` | Create a new case |
| POST | `/api/reviews/start` | Start multi-agent review |
| GET | `/api/reviews/:id` | Get workflow status |
| POST | `/api/reviews/:id/decision` | Submit human decision |
| GET | `/api/reviews/:id/audit` | Get audit log |
| GET | `/api/agents` | List agent definitions |

---

## Autonomy Modes

| Mode | Behaviour |
|------|-----------|
| **Human Approval Required** | Every recommendation requires explicit human sign-off |
| **Exception Only Review** | Clear approvals auto-complete; referrals and rejections require human review |

> AI recommendations are **advisory only**. Final executable actions are always gated by human approval or exception rules.

---

## Project Structure

```
onboarding_reviewer/
├── backend/
│   └── src/
│       ├── agents/          # 4 specialist agent implementations
│       ├── orchestrator/    # Workflow supervisor
│       ├── services/        # Business logic + audit
│       ├── routes/          # REST API endpoints
│       ├── types/           # TypeScript types + Zod schemas
│       ├── db/              # Schema, seed, migration
│       └── tests/           # Vitest unit tests
├── frontend/
│   └── src/
│       ├── components/      # React UI components
│       ├── api/             # API client
│       └── types/           # Frontend types
├── data/samples/            # Synthetic JSON test cases
├── docker-compose.yml       # MySQL container (optional)
├── .env.example             # Environment template
├── SETUP.md                 # Detailed setup guide
└── README.md
```

---

## Security Considerations

- All data is synthetic — never enter real PII
- Secrets in `.env` only (never committed)
- Production requires: SSO, RBAC, TLS, encryption at rest, rate limiting, immutable audit logs
- AI recommendations separated from executable actions

---

## Known Limitations

- No authentication/authorisation
- Rule-based agents (no live LLM by default)
- No real sanctions/PEP API integration
- No real-time streaming of agent progress
- Single-user prototype

---

## Productionisation Path

1. Containerise with Docker/K8s + CI/CD
2. Add SSO, RBAC, API gateway, secrets manager
3. Replace rule-based agents with LLM + external KYC APIs
4. Progressive autonomy rollout with confidence thresholds and audit sampling

---

## AI Development Tools Disclosure

Built with assistance from **Cursor AI**. Architectural decisions made personally:

- Custom TypeScript orchestrator over third-party frameworks
- Typed agent contracts with Zod schemas
- Sequential pipeline with structured hand-offs
- Separation of AI recommendation from human-gated execution
- Two-tier autonomy model and MySQL audit log design

---

## License

This project is for educational and assessment purposes.

---

## Author

**Prafull Ahire** — [GitHub](https://github.com/Prafullahire)
