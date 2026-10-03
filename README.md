# CreatorOS — "Your AI Operating System for Content."

CreatorOS is an enterprise-grade, all-in-one operating platform engineered for content creators, media studios, and autonomous solopreneurs. It unites analytics intelligence, social media management, multimodal video editing, content repurposing, AI strategy synthesis, scheduling, and creator CRM into a single unified workspace.

---

## 🚀 Key Architectural Highlights

- **Frontend (`/frontend`)**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend (`/backend`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL schema, modular service architecture.
- **Separate Admin Console (`/admin`)**: Fully decoupled administrative portal for workspace management, feature flags, AI token tracking, and system health telemetry.
- **Social Integration Adapter Layer**: Pluggable `SocialPlatformAdapter` with built-in OAuth support and high-fidelity Mock Mode for YouTube, Instagram, TikTok, LinkedIn, and X.
- **AI Operating Intelligence**: Provider abstraction with contextual memory injection from Creator Brain, Hook DNA sequencing, and autonomous terminal execution.
- **Video Lab & Repurpose Engine**: Integrated speech transcription, highlight detection, viral clip extraction, and platform-specific format translation.

---

## 📦 Project Structure

```
CreaterOS/
│
├── frontend/             # Creator application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/   # Layout, Sidebar, MobileNav
│   │   ├── pages/        # 40+ Creator screens (Dashboard, Analytics, DNA, Composer, Video Lab...)
│   │   ├── services/     # Modular API clients (apiCore, apiPublishing, apiSystem)
│   │   └── ...
│
├── backend/              # Production API service (Express + TypeScript + Prisma)
│   ├── prisma/           # schema.prisma (Normalized relational models)
│   ├── src/
│   │   ├── ai/           # AI Provider Abstraction
│   │   ├── integrations/ # SocialPlatformAdapter architecture
│   │   ├── routes/       # Auth, Dashboard, Content, Video Lab, Autopilot, Brand...
│   │   ├── utils/        # Persistent mock database with demo datasets
│   │   └── ...
│
├── admin/                # Decoupled Admin Portal (React + Vite)
│   ├── src/
│   │   ├── components/   # Admin Layout & Telemetry
│   │   ├── pages/        # Dashboard, Users, Workspaces, Health, AI Usage, Flags...
│   │   └── services/     # adminApi client
│
├── docker-compose.yml    # Containerized multi-service deployment
├── .env.example          # Environment variable specifications
└── README.md
```

---

## 🛠️ Quickstart Installation & Execution

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm install
npm run build
node dist/index.js
```
The backend includes a health check at `http://localhost:5000/api/health`.

### 2. Start the Creator Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
Default Creator Login:
- Email: `creator@creatoros.ai`
- Password: `CreatorOS@2026`

### 3. Start the Dedicated Admin Portal (Port 3001)
```bash
cd admin
npm install
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.
Default Admin Login:
- Email: `admin@creatoros.ai`
- Password: `CreatorOS@2026`

---

## 🧪 Verification & Automated Testing

Seed the database, then start the API and run the route suite:
```bash
cd backend
npm run migrate:deploy
npm run seed
npm run seed:verify     # prints row counts per table
npm run dev             # in one shell
npm run smoke           # in another
```
`npm run smoke` exercises every route the UI depends on — auth, all read
endpoints, full CRUD lifecycles, workspace isolation and the admin console —
then deletes the rows it created. Override the target with `SMOKE_BASE`.

---

## 🤖 AI Integration

CreatorOS talks to models through a single interface (`IAIProvider` in
`backend/src/ai/provider.ts`). Every AI screen depends only on that interface,
so changing provider is a **configuration change, not a code change**.

```
route handler  →  IAIProvider  →  LLMProvider  →  POST /chat/completions
                                        ↓
                              AIUsage row (tokens, latency, model)
```

### Quick start

1. Copy the env template and add a key:
   ```bash
   cp .env.example backend/.env
   ```
2. Set your provider and model in `backend/.env`:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY="sk-..."
   AI_MODEL="gpt-4o-mini"
   ```
3. Restart the backend and confirm it took effect:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/ai/status
   ```
   ```json
   { "provider": "openai", "model": "gpt-4o-mini", "isMock": false,
     "credentialsPresent": { "openai": true, "huggingface": false, "anthropic": false } }
   ```

`isMock: true` means no key was found and you are seeing canned copy. The
backend logs a warning at boot explaining which key it looked for.

### Configuration reference

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `openai` · `huggingface` · `mock` · `auto` (default: first key found, else mock) |
| `AI_MODEL` | Model id sent to the endpoint. **Provider-specific** — see below. |
| `AI_BASE_URL` | Overrides the base URL for *any* provider (local Ollama / vLLM / LM Studio) |
| `AI_TEMPERATURE` | Default `0.7` |
| `AI_MAX_OUTPUT_TOKENS` | Default `1200` |
| `AI_JSON_MODE` | `true` sends `response_format: json_object`. Set `false` if a model rejects it. |
| `AI_MONTHLY_TOKEN_BUDGET` | Cap used by the sidebar usage widget |

### Behaviour worth knowing

- **Graceful degradation.** Every call is wrapped: if the provider times out or
  errors, the deterministic mock output is returned and a warning is logged, so
  a caption request never becomes a 500. A `401`/`403` is logged at `error`
  level because that means the key itself is wrong.
- **Usage is recorded.** Each call writes an `AIUsage` row (provider, model,
  request type, tokens, latency). This feeds the admin console token dashboard
  and the per-user budget bar — previously that table was never written to.
- **JSON is parsed defensively.** Structured outputs go through a tolerant parser
  that strips markdown fences and falls back to the mock shape if the model
  returns prose.



### Per-user memory ("gets smarter over time")

CreatorOS does **not** retrain the model per user — that is unaffordable and cannot
be served at request time. Instead `backend/src/services/memory.service.ts`
implements a retrieval + reinforcement loop on top of one shared base model:

```
publish a post → learnFromContent()  → writes a lesson to CreatorMemory
                                             │
next AI call → recallMemories(query)   ←────┘   vector cosine + keyword + reinforcement
                                             │
                                    injected into the system prompt
                                             │
                              used → useCount++ (reinforced)
```

Four mechanisms make it improve per user:

| Mechanism | What it does |
| --- | --- |
| **Store** | `CreatorMemory` holds durable facts (schedule, hook style, audience). Saving the same `key` updates rather than duplicating. |
| **Recall** | Every strategist/caption call scores memories against the query — vector cosine when an embedding model is configured, keyword overlap otherwise — and injects the top few into the system prompt. |
| **Reinforce** | Recalled memories get `useCount++`, which biases future ranking. Facts that prove useful surface first; `pruneMemories()` drops the tail. |
| **Learn** | When a post is published, `learnFromContent()` compares its engagement against the workspace baseline and stores a concrete lesson — e.g. *"On TIKTOK, 'X' (SHORT) beat average by 140%. Reuse this format."* Thresholds are deliberately conservative so one lucky post doesn't become gospel. |

**pgvector is not required.** Vectors are stored in a `Json` column and scored in
application code, so this works on any Postgres. If you outgrow that, the upgrade
path is `CREATE EXTENSION vector` plus an HNSW index on the same column — the
recall function is already isolated behind `cosine()`.

To see what's actually being recalled:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query":"what hook style works?"}' \
  http://localhost:5000/api/brand/memory/recall
```

Also available: `POST /api/brand/memory` (save), `POST /api/brand/memory/learn`
(distil a specific post). Publishing via `PUT /api/content/:id` triggers learning
automatically.

Verify the loop with `npm run test:memory` (24 checks: dedupe, ranking,
reinforcement, win/lose extraction, guards).

### Using Hugging Face

Hugging Face exposes an **OpenAI-compatible** endpoint, so no new adapter is
needed — point the existing client at the router.

1. Create a token at **https://huggingface.co/settings/tokens** (read access is
   enough for inference).
2. Configure:
   ```env
   AI_PROVIDER=huggingface
   HUGGINGFACE_API_KEY="hf_..."
   HUGGINGFACE_BASE_URL="https://router.huggingface.co/v1"
   AI_MODEL="Qwen/Qwen2.5-7B-Instruct"
   ```
3. Verify with `/api/ai/status`, then browse available models:
   ```bash
   curl -H "Authorization: Bearer hf_..." https://router.huggingface.co/v1/models
   ```

Append a routing suffix to control which upstream provider serves the request:

| Suffix | Behaviour |
| --- | --- |
| *(none)* or `:fastest` | Highest throughput — the default |
| `:cheapest` | Lowest cost per output token |
| `:preferred` | Your own provider preference order |

So `AI_MODEL="Qwen/Qwen2.5-7B-Instruct:cheapest"` pins the cheap route.

> This OpenAI-compatible router covers **chat completions only**. Image,
> embedding and speech models need the task-specific HF clients.

#### Which model to pick

**Recommended default: `Qwen/Qwen2.5-7B-Instruct`**

CreatorOS's workload is short, structured, creative writing — captions, hooks,
CTAs, idea lists, JSON scene breakdowns. That profile maps to a mid-size
instruction-tuned model, and Qwen2.5-7B-Instruct hits the sweet spot:

- **Reliable JSON.** Several screens depend on strict structure (idea arrays,
  script scenes, DNA scores). It follows output formats far more consistently
  than similarly-sized general models, so the fallback path triggers rarely.
- **Cost.** Roughly an order of magnitude cheaper per token than a frontier
  model, and a 7B fits comfortably on modest hardware if you self-host.
- **Multilingual + long context.** Handles non-English niches and the 25-item
  content library injected into "AI My Content" without truncating.

Alternatives, depending on your constraint:

| Model | Pick it when |
| --- | --- |
| `google/gemma-2-2b-it` | You want the cheapest/fastest option. Fine for hashtags and CTAs; too weak for scripts and strategy chat. |
| `Qwen/Qwen3-4B-Thinking-2507` | You want reasoning for content analysis / DNA scoring and can accept slower responses. |
| `Qwen/Qwen2.5-7B-Instruct-1M` | You plan to feed it very long transcripts (Video Lab repurposing). |
| `openai/gpt-oss-120b` | You need the highest open-weights quality and cost is secondary. |

**Avoid reasoning models (`DeepSeek-R1`, `Qwen3-*-Thinking`) for the caption and
hashtag endpoints.** They emit visible reasoning before the answer, which wastes
tokens and slows down short generations. Reserve them for `analyzeContent`.

**Keep a frontier model for AI Strategist.** That screen injects your Creator
Brain and asks for genuinely strategic advice; it benefits far more from model
quality than the rest of the app, and it is low-volume.

### Running a model locally

No API key, no per-token cost, works offline:
```bash
ollama pull qwen2.5:7b
```
```env
AI_PROVIDER=openai          # any provider name; the URL below wins
AI_BASE_URL="http://localhost:11434/v1"
AI_MODEL="qwen2.5:7b"
AI_JSON_MODE=false          # Ollama ignores response_format
```

### Anthropic

Anthropic's Messages API is **not** OpenAI-compatible, so it is not wired up.
Use an OpenAI-compatible gateway (LiteLLM, OpenRouter, Martian) and point
`AI_BASE_URL` at it — otherwise the backend falls back to the mock provider and
logs a warning.

---

## 🌐 Supported Screen Catalog

### Creator OS Platform
1. **Landing Page** (`/`)
2. **Login & Auth** (`/login`, `/register`, `/forgot-password`)
3. **Onboarding Wizard** (`/onboarding`) — 7-step profile, category, platform, and voice setup
4. **Dashboard Command Center** (`/dashboard`)
5. **Analytics Intelligence** (`/analytics`, `/analytics/platforms`)
6. **Content Management** (`/content`, `/content/:id`, `/content/:id/dna`)
7. **Ideas & Opportunities** (`/ideas`, `/opportunities`)
8. **AI Workspace** (`/ai/strategist`, `/ai/my-content`, `/ai/command-center`)
9. **Creation & Studio** (`/calendar`, `/composer`, `/create`, `/scripts`)
10. **Video Lab & Repurposing** (`/video-lab`, `/thumbnails`)
11. **Audience & Community** (`/audience`, `/comments`, `/trends`, `/benchmark`)
12. **Automation & Operations** (`/scheduler`, `/publishing`, `/autopilot`)
13. **Brand & Business** (`/creator-brain`, `/memory`, `/brand-kit`, `/revenue`, `/brand-deals`, `/campaigns`, `/team`, `/reports`)
14. **System & Security** (`/notifications`, `/settings`, `/security`)

### Separate Admin Application
1. **Admin Login** (`/login`)
2. **Admin Command Dashboard** (`/dashboard`)
3. **Creator Users** (`/users`)
4. **Workspaces** (`/workspaces`)
5. **Platform Health & Latency** (`/health`)
6. **Job Monitor** (`/jobs`)
7. **AI Usage & Token Billing** (`/ai-usage`)
8. **Cloud Media Storage** (`/storage`)
9. **Feature Flags** (`/feature-flags`)
10. **Security Audit Logs** (`/audit-logs`)

