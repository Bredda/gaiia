# 🧠 Gaiia – Generative AI In Action

**Gaiia** is a unified generative AI demo application designed to explore various use cases (fact-checking, bias detection, multi-agent reasoning, etc.) through a shared, modular architecture.

Each feature is self-contained and accessible via a context-aware interface, while sharing common logic and infra (auth, streaming, graph execution, UI shell...).

## ✨ Why this project?

Building GenAI demos often leads to repeating the same things (auth, streaming hooks, UI layout, etc.).  
**Gaiia** solves that by offering:

- ✅ A single codebase to centralize all GenAI demo features
- ✅ A modular architecture where each app/feature lives independently
- ✅ Shared UI/UX, API, and streaming mechanics
- ✅ A better developer experience (no more boilerplate copying)

## 🧱 Tech Stack

| Layer               | Tech                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Frontend            | Next.js (App Router)                                                                          |
| UI Components       | [shadcn/ui](https://ui.shadcn.com) + TailwindCSS                                              |
| Authentication      | [Supabase Auth](https://supabase.com/auth)                                                    |
| Graph orchestration | [LangGraph (TS)](https://docs.langchain.com/langgraph/js/)                                    |
| LLMs                | OpenAI (can be swapped)                                                                       |
| SSE Streaming       | [@microsoft/fetch-event-sourcee](https://github.com/Azure/fetch-event-source) + custom runner |
| State management    | [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)                          |

All apps share:

- A **generic graph runner** (`createGraphRunner`) using SSE
- A **hook** (`useGraphRunner`) for live LLM feedback (tokens, updates, final response)
- A **dynamic layout** with context-aware navigation (via pathname)
- Shared **SSE API route**: `/api/graph/[slug]`

## 🚀 Example: Clarifai

**Clarifai** is a feature showcasing AI-assisted bias and claim detection. It takes a user-provided text and:

- Segments it into logical chunks
- Extracts factual claims and detects emotional/ideological biases
- Verifies claims (true/false/unverifiable)
- Generates an interactive, annotated text and a synthetic final report

→ Useful for fact-checking, critical reading, or discourse analysis.

## 🚦 Running the project

This project uses a [`justfile`](https://github.com/casey/just) to streamline local dev workflows.

### 🧰 Prerequisites

- Node.js (v18+)
- Docker + Docker Compose (for Supabase local)
- [Just](https://github.com/casey/just) (command runner)

### 📂 Project layout

```
/gaiia/                ← Next.js app (UI + graphs)
/ops/
  /supabase/           ← Local Supabase instance (with CLI config)
/justfile              ← Dev commands
```

### 🧪 Environment setup

Copy the example env file and configure your OpenAI key (and later Supabase):

```bash
cp gaiia/.env.example gaiia/.env
```

Update the following:

```
OPENAI_API_KEY=your-key-here
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
```

### ▶️ Start the UI + backend

```bash
just ui
```

This runs:

```bash
cd gaiia && npm install && npm run dev
```

### 🗄️ Start Supabase locally

```bash
just supabase
```

This runs Supabase Studio + local database via Docker, from `/ops/supabase`.
Supabase sutdio is available on `http://localhost:5173/`

### 🧪 Available `just` commands

```bash
just ui          # Install and launch the Next.js app
just supabase    # Start local Supabase (via CLI / Docker)
# (More commands to come...)
```

## ⚠️ Disclaimer

This is a demo-oriented project meant to explore generative AI capabilities and architectures.
It is not production-ready, but designed to be extensible, educational, and inspiring.
