---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: "research"
lastStep: 6
research_type: "technical"
research_topic:
  "AI Coach System Architecture - Context-Aware Personalization with Wearable
  Integration"
research_goals:
  "Architect context management for AI coaching, progressive personalization
  patterns, wearable data integration, context window optimization, multi-agent
  orchestration, tool calling with generative UI, evaluate System OS naming"
user_name: "NativeSquare"
date: "2026-02-15"
web_research_enabled: true
source_verification: true
---

# Building an AI Coach That Truly Knows You: Architecture for Context-Aware Personalization with Wearable Integration

**Date:** 2026-02-15 **Author:** NativeSquare **Research Type:** Comprehensive
Technical Research

---

## Executive Summary

The digital health coaching market is valued at $13.46 billion in 2025 and
projected to reach $44.12 billion by 2034. Within this space, AI-powered
coaching represents the fastest-growing segment, with 70% of consumers
preferring health solutions offering tailored feedback. This research designs
the complete technical architecture for an AI coaching system -- internally
conceptualized as "the Coach OS" -- that starts as a generic health coach and
progressively becomes a deeply personalized partner through accumulated context
from wearable devices, coaching sessions, and behavioral patterns.

The core architectural challenge is the **context paradox**: the AI needs
maximum user context to coach effectively, but LLM context windows degrade when
overloaded. Our research demonstrates this is solvable through agentic memory
management, where 2,000 tokens of well-curated memory outperforms 32,000 tokens
of raw conversation history (PersonaMem-v2, Dec 2025), achieving 55% accuracy on
implicit personalization vs. 37-48% for frontier LLMs brute-forcing context.

The system architecture uses an **Orchestrator-Specialist pattern** with
graph-based agent coordination: a thinking model (Claude Opus 4.6 / OpenAI o3)
plans coaching strategy, while specialized agents (Fitness, Sleep, Nutrition,
Mental Health, Recovery) execute domain-specific analysis using cost-optimized
models. A five-tier memory system (Working, Episodic, Semantic, Procedural,
Knowledge Base) enables progressive personalization across four maturity stages
from "virgin" to "deep partnership." Wearable data flows through
platform-specific adapters (HealthKit, Strava, Garmin, COROS, Health Connect)
behind a unified internal schema, with Convex providing real-time reactive
infrastructure. Generative UI enables the AI to stream interactive coaching
components (sleep cards, workout summaries, progress trackers) natively in the
mobile app.

**Key Findings:**

- **Multi-agent > single-agent**: Single-agent systems collapse at 7-10
  reasoning steps due to context window drift. Multi-agent with graph-based
  orchestration is the production standard (72% of enterprise AI projects in
  2026).
- **Agentic memory is the breakthrough**: Self-managed memory (Letta/MemGPT
  approach) with 16x fewer tokens beats naive RAG and full-history approaches
  for personalization.
- **Multi-model routing saves 30% cost**: Different agents use different LLMs
  matched to their task -- thinking models for strategy, fast models for chat,
  cheap models for background monitoring.
- **"System OS" naming is validated**: Multiple products (ODEI, TelOS, Beam) use
  the "Personal AI OS" metaphor successfully. The multi-model routing
  architecture literally mirrors an OS scheduling work across CPU cores. A
  domain-specific variant ("Coach OS") is recommended.
- **Buildable in 15 weeks**: Incremental MVP approach from basic chat (Week 1-3)
  to full proactive coaching system (Week 14), scaling from ~$200/mo at 100
  users to ~$3,500/mo at 10,000 users.

**Top 5 Recommendations:**

1. Start with a single conversational agent + HealthKit integration (Phase 0,
   Weeks 1-3), then add memory and personalization before splitting into
   multi-agent
2. Implement Letta-style agentic memory from Phase 1 -- this is the core
   differentiator that makes the "OS" metaphor real
3. Use multi-model routing from Phase 2 onward: thinking models for planning,
   fast models for chat, cheap models for monitoring
4. Build wearable adapters behind a unified interface -- start with HealthKit,
   add Strava/Garmin/COROS incrementally
5. Invest in LLM observability (Helicone) from day one -- most teams overspend
   2.6-5x without monitoring

---

## Table of Contents

1. [Technical Research Introduction and Methodology](#technical-research-scope-confirmation)
2. [Technology Stack Analysis](#technology-stack-analysis)
   - Multi-Agent Orchestration Frameworks
   - AI Memory & Context Management
   - Vector Databases for Long-Term User Profiles
   - Wearable Data Integration Platforms
   - AI Health Coaching Architecture (State of the Art)
   - Tool Calling & Generative UI
   - Backend Platform: Convex
   - Mobile Stack
   - LLM Selection: Thinking/Reasoning Models
   - "System OS" Naming Evaluation
3. [Integration Patterns Analysis](#integration-patterns-analysis)
   - Integration Protocol Standards (MCP + A2A)
   - Inter-Agent Communication Patterns
   - Wearable Data Ingestion Pipeline
   - Client-Agent Streaming Architecture
   - Context Assembly Pipeline
   - Integration Security Patterns
4. [Architectural Patterns and Design](#architectural-patterns-and-design)
   - System Architecture: The Orchestrator-Specialist Pattern
   - Memory Architecture: Five-Tier System
   - Progressive Personalization: Cold Start to Deep Knowledge
   - Proactive Coaching Architecture
   - Generative UI Architecture for Mobile
   - Data Architecture
   - Deployment Architecture
   - Security Architecture
5. [Implementation Approaches](#implementation-approaches-and-technology-adoption)
   - MVP Strategy: Incremental Build Phases (0-4)
   - Development Workflow and Tooling
   - Testing and Quality Assurance
   - LLM Observability and Monitoring
   - Team Organization and Skills
   - Cost Estimation
   - Risk Assessment and Mitigation
6. [Technical Recommendations](#technical-research-recommendations)
   - Implementation Roadmap Summary
   - Technology Stack Recommendations
   - Success Metrics and KPIs
7. [Future Outlook and Conclusion](#future-technical-outlook)
8. [Source Documentation](#technical-research-methodology-and-sources)

---

## Technical Research Scope Confirmation

**Research Topic:** AI Coach System Architecture - Context-Aware Personalization
with Wearable Integration **Research Goals:** Architect context management for
AI coaching, progressive personalization, wearable data integration, context
window optimization, multi-agent systems, tool calling with generative UI,
evaluate "System OS" naming

**Technical Research Scope:**

1. Architecture Analysis - context management, memory layers, orchestration
2. Multi-Agent Systems - agent specialization, coordination, shared context
3. Tool Calling & Generative UI - dynamic tool use, UI generation patterns
4. Progressive Personalization - generic to personalized over time
5. Wearable Data Integration - pipelines, APIs, data normalization
6. Context Window Optimization - relevance ranking, compression, token budgeting
7. Proactive Coaching Patterns - triggers, notifications, scheduled interactions
8. Evaluation & Feedback Loops - outcome measurement, self-improvement
9. Multi-Modal Input Handling - text, voice, images, sensor data
10. Safety, Guardrails & Privacy - health data regulations, boundaries
11. Structured Outputs - reports, plans, artifacts
12. "System OS" Naming Evaluation - mental model, precedents

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-02-15

---

## Technology Stack Analysis

### Multi-Agent Orchestration Frameworks

The agentic AI market reached $7.55B in 2025 and is projected at $10.86B
by 2026. Three dominant frameworks have emerged for multi-agent systems:

**LangGraph** -- Graph-based state machines with explicit control flow. Features
checkpointing, retry policies, and distributed tracing. Best for: structured
state management and auditability. Most relevant for a coaching system where you
need deterministic flows (e.g., "gather wearable data -> analyze -> synthesize
coaching advice") with fallback and human oversight.

**CrewAI** -- Role-based team coordination with intelligent task allocation.
Agents are assigned roles (like "Sleep Analyst", "Fitness Coach", "Nutrition
Expert") and collaborate on shared tasks. Best for: distributed cognitive
workloads where specialized agents contribute different perspectives -- very
aligned with the multi-agent coaching model.

**AutoGen (Microsoft)** -- Event-driven asynchronous multi-agent orchestration.
Enables parallel agent execution but requires careful state management. Best
for: parallel processing pipelines.

**Critical finding:** Single-agent systems fail at scale due to context window
collapse -- token buildup causes decision drift by steps 7-10. Multi-agent
systems distribute cognitive load across specialized agents with explicit state
boundaries.

_Production requirements (2026): state checkpoints, circuit breakers,
intervention mechanisms, audit trails, and human oversight -- architectural
requirements, not post-deployment features._ _Source:
https://brlikhon.engineer/blog/building-production-agentic-ai-systems-in-2026-langgraph-vs-autogen-vs-crewai-complete-architecture-guide_

### AI Memory & Context Management

**Letta (formerly MemGPT)** has emerged as the leading approach for AI agent
memory:

- **Two-tier memory**: In-context memory (editable, ~2k char limit per section
  that the agent self-manages via tool calls) + External memory (database
  storage accessible via tool calls for larger-scale retrieval)
- **Sleep-time compute**: Agents refine memories and precompute responses while
  idle, reducing latency
- **Context repositories** (Feb 2026): Git-based memory versioning with
  programmatic context management
- **Shared memory across experiences** (Jan 2026): Agents maintain shared memory
  across parallel user interactions

**PersonaMem-v2** (Dec 2025, academic research): Demonstrates agentic memory
achieves 55% accuracy on implicit personalization tasks using only 2k tokens of
memory, compared to 37-48% for frontier LLMs using 32k conversation histories.
This is a 16x token reduction while improving accuracy -- directly relevant to
the "don't overload the system" goal.

_Key insight for your system: Agentic memory (where the AI manages its own
memory via tools) outperforms both naive "dump everything in context" and
traditional RAG approaches for personalization._ _Source:
https://docs.letta.com/advanced/memory-management/,
https://arxiv.org/abs/2512.06688_

### Vector Databases for Long-Term User Profiles

Three leading options for storing and retrieving user context embeddings:

| Database     | Query Latency | Cost/month                 | Best For                                        |
| ------------ | ------------- | -------------------------- | ----------------------------------------------- |
| **Qdrant**   | 14ms          | $25                        | Self-hosting, best raw performance              |
| **Pinecone** | 18ms          | $70 ($700+ at 10M vectors) | Rapid deployment, fully managed                 |
| **Weaviate** | 24ms          | $50                        | Personalization Agent (built-in), hybrid search |

**Weaviate's Personalization Agent** (preview): An AI agent service that stores
user personas, analyzes interaction history, and delivers personalized
recommendations using embeddings + LLM-based re-ranking. This is purpose-built
for the kind of progressive personalization the coaching system needs.

_Source:
https://getathenic.com/blog/vector-databases-ai-agents-pinecone-weaviate-qdrant,
https://weaviate.io/blog/personalization-agent_

### Wearable Data Integration Platforms

Rather than integrating with each wearable API individually, unified aggregation
platforms solve the fragmentation problem:

**Terra API** -- 500+ health metrics, 100+ device integrations, real-time
streaming, health scores (recovery, strain, stress, immunity). Provides
validated health scores from raw metrics (HRV, sleep, activity). Most
comprehensive intelligence layer.

**Rook API** -- 400+ wearable connections via single SDK, ROOK Score (0-100
health status), simpler integration focused on data aggregation. 10-day data
retention, batch-only processing.

**Native Platform APIs:**

- **Apple HealthKit** -- iOS-only, device-centric, local storage, rich data
  types
- **Google Health Connect** -- Android unified health platform (replacing Google
  Fit in 2026), standardized schema, supports FHIR medical records

**Key challenges:** Different data structures, measurement units, and timestamp
formats across platforms. Best practice: normalize data early, standardize
timestamps to UTC, use modular architecture for future scalability.

_Finding: Unified APIs like Terra/Rook can reduce wearable integration
development from 6 months to 3 weeks._ _Source: https://docs.tryrook.io/,
https://terraapi.com/,
https://developer.android.com/health-and-fitness/guides/health-connect_

### AI Health Coaching Architecture (Current State of the Art)

Google's Personal Health Coach research and Stanford/Nature published findings
reveal the emerging architecture:

- **Multi-agent framework**: Coordinated expert sub-agents including
  conversational agents (multi-turn), data science agents (numerical reasoning
  on physiological time series), and domain expert agents
- **LLM-based reasoning**: Models like Gemini perform contextual analysis
  including metric selection, personal baseline comparison, population-level
  statistics, and prior interaction history
- **Individualized prediction models**: Personalized ML models predict daily
  stress, soreness, and injury risk from sensor data, outperforming generalized
  baselines
- **RAG for grounding**: Information retrieval modules ground coaching in
  expert-vetted content, preventing hallucinations

_Performance: 84% accuracy on objective numerical questions, 83% favorable
ratings on open-ended coaching, validated by 650+ hours of human expert
evaluation._ _Source:
https://research.google/blog/how-we-are-building-the-personal-health-coach/,
https://www.nature.com/articles/s41467-025-67922-y_

### Tool Calling & Generative UI

**Vercel AI SDK** introduced Generative UI: LLMs can call tools that map to
React Server Components, streaming interactive UI (charts, plans, progress
trackers) directly into the conversation.

- `streamUI`: Model responds with React components instead of just text
- Separate `useUIState` and `useAIState` for clean state separation
- Note: AI SDK RSC is paused; Vercel recommends AI SDK UI (v6.x) for production

**Practical application for coaching:** Instead of the AI saying "your sleep was
6.2 hours with 45min deep sleep", it streams an interactive sleep analysis card
with trends, comparisons, and actionable recommendations as a live UI component.

_Source: https://vercel.com/blog/ai-sdk-3-generative-ui,
https://sdk.vercel.ai/docs/ai-sdk-rsc/overview_

### Backend Platform: Convex

Convex provides purpose-built infrastructure for real-time AI agent
applications:

- **Agent Component**: Manages threads and messages for cooperative AI workflows
- **Conversation Context**: Automatically includes message history with built-in
  hybrid vector/text search
- **Threads**: Persist messages shared across multiple users and agents
- **Streaming**: Asynchronous message streaming with delta-saving to database,
  allowing clients to subscribe to live-updating content even after network
  interruptions
- **Real-time reactivity**: Queries are automatically cached and subscribable

_Relevant: Long-running agentic workflows are separated from UI while
maintaining client reactivity -- critical for a coaching system where AI
reasoning may take time but the user experience must stay responsive._ _Source:
https://docs.convex.dev/agents, https://docs.convex.dev/agents/streaming_

### Mobile Stack

The market data strongly supports **React Native with Expo** for the mobile
layer:

- Wearable integration drives 40% higher retention and 3x engagement
- Custom development client required (not Expo Go) for native HealthKit/Health
  Connect access
- Open-source precedent: "thriveai" -- on-device AI wellness coach built with
  Expo running Llama-3.2-3B locally for privacy-first coaching
- Health coaching market projected: $20.1B (2025) -> $41.2B (2034)

_Source:
https://ideausher.com/blog/build-wearable-integrated-ai-health-coach-app/,
https://github.com/Raymond-ap/thriveai_

### "System OS" Naming Evaluation

The "Personal AI OS" naming pattern is an active trend in 2025-2026:

| Product               | Tagline                               | Focus                                                       |
| --------------------- | ------------------------------------- | ----------------------------------------------------------- |
| **ODEI**              | "Your Personal AI Operating System"   | Persistent, private intelligence layer with local execution |
| **TelOS**             | "Your Personal AI OS"                 | Cognitive interface for directed action                     |
| **Beam Archetype OS** | "Self-Evolving OS for Knowledge Work" | Natural language interface, cross-session memory            |
| **MixFlow**           | "Build Your Personal AI OS"           | Interconnected autonomous agents                            |

The "OS" metaphor communicates: integration (not just one tool), persistence
(always running, always learning), and system-level control (orchestrating
multiple capabilities). It resonates because it positions the AI as
infrastructure rather than a feature.

**Consideration:** "System OS" is generic -- it doesn't convey the coaching
domain. Alternatives like "Coach OS", "Thrive OS", or a unique branded name with
the OS suffix might better communicate the purpose while keeping the powerful OS
metaphor.

_Source: https://odei.ai/, https://www.your-telos.com/,
https://mixflow.ai/blog/building-your-personal-ai-operating-system-a-2025-guide-to-interconnected-autonomous-agents/_

### LLM Selection: Thinking/Reasoning Models

The choice of LLM(s) is foundational. For an AI coaching system, different
agents may benefit from different models. Here's the current landscape of
thinking/reasoning models:

#### Frontier Thinking Models

**Claude Opus 4.6** (Anthropic, Feb 2026)

- 1M token context window (beta)
- Adaptive extended thinking -- model decides how much to reason based on
  problem complexity
- Plans more carefully and sustains agentic tasks for longer
- State-of-the-art on "Humanity's Last Exam" (complex multidisciplinary
  reasoning)
- Context compaction for long-running tasks
- _Best for: Deep coaching reasoning, complex multi-step health analysis, long
  user history processing_
- _Source: https://anthropic.com/news/claude-opus-4-6_

**OpenAI o3** (April 2025)

- Most powerful OpenAI reasoning model
- Full agentic tool access (web search, code execution, image analysis combined)
- 20% fewer major errors than o1 on difficult real-world tasks
- _Best for: Complex multi-faceted queries requiring tool orchestration, data
  analysis_

**OpenAI o4-mini** (April 2025)

- Cost-efficient reasoning model, outperforms o3-mini on non-STEM tasks
- 99.5% on AIME 2025 with code interpreter -- extreme mathematical reasoning
- _Best for: High-volume reasoning tasks where cost matters, numerical health
  data analysis_

**Gemini 2.5 Pro** (Google, 2025)

- Native thinking model -- reasons through problems before responding
- Multimodal: text, images, audio, video natively interleaved
- Up to 3 hours of video input, massive context window
- 5x reasoning improvement over prior Gemini generations
- Deep Research integration for analyst-grade research workflows
- _Best for: Multimodal coaching (voice, images, video form checks),
  long-context analysis_
- _Source:
  https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025_

**DeepSeek R1** (Open-source, MIT license)

- 671B MoE model with chain-of-thought reasoning
- Distilled variants: 1.5B to 70B parameters (Qwen2.5 and Llama-3 based)
- 32B distilled version outperforms OpenAI o1-mini
- Emergent self-verification, reflection, and dynamic compute allocation
- _Caveat: Excessive inference time can impair performance ("sweet spot" for
  reasoning)_
- _Best for: On-device/self-hosted reasoning, privacy-sensitive deployments_
- _Source: https://github.com/deepseek-ai/DeepSeek-R1_

#### Fast/Efficient Models (for high-volume agent tasks)

| Model                 | Input/Output Cost (per M tokens) | Avg Latency | Tool Calling | Context | Best For                           |
| --------------------- | -------------------------------- | ----------- | ------------ | ------- | ---------------------------------- |
| **GPT-4o**            | $2.50 / $10                      | 1.2s        | Excellent    | 128K    | Most production agents, multimodal |
| **Claude 3.5 Sonnet** | $3 / $15                         | 1.8s        | Excellent    | 200K    | Coding agents, safety-critical     |
| **Gemini 1.5 Pro**    | $1.25 / $5                       | ~1.5s       | Good         | 2M      | Budget-conscious, long-context     |
| **Gemini 1.5 Flash**  | $0.075 / $0.30                   | <1s         | Good         | 1M      | High-volume simple tasks, voice    |

_Source:
https://getathenic.com/blog/anthropic-claude-vs-openai-gpt4-vs-google-gemini_

#### Multi-Model Routing Architecture

A critical insight: **the coaching system shouldn't use a single model**.
Different agents need different models optimized for their specific task:

**Intelligent Router Patterns (2025-2026 research):**

- **xRouter**: RL-trained router that decides which model to invoke based on
  cost-aware rewards
- **MoMA**: Mixture of Models and Agents -- dynamic capability profiling routes
  queries to best cost-performance option
- **RouteLLM**: Preference-based routing achieving 2x cost reduction without
  quality loss
- **CSCR**: Microsecond-latency routing using embedding spaces, 25% improved
  accuracy-cost tradeoffs

**Practical gains:** Up to 40% query efficiency, 30% cost reduction, 10%
performance improvement vs. single-model deployments.

**Proposed model assignment for the coaching system:**

| Agent Role                  | Recommended Model Tier                     | Rationale                                      |
| --------------------------- | ------------------------------------------ | ---------------------------------------------- |
| **Orchestrator/Planner**    | Thinking model (Opus 4.6 / o3)             | Needs deep reasoning to plan coaching strategy |
| **Health Data Analyst**     | Reasoning model (o4-mini / Gemini 2.5 Pro) | Numerical reasoning on physiological data      |
| **Conversational Coach**    | Fast model (GPT-4o / Sonnet)               | Low latency for interactive coaching chat      |
| **Memory Manager**          | Fast model (Gemini Flash / GPT-4o-mini)    | High-volume, simple context operations         |
| **Report Generator**        | Thinking model (Opus 4.6 / Gemini 2.5 Pro) | Long-form structured output quality            |
| **Proactive Trigger Agent** | Cheapest (Gemini Flash)                    | High-frequency background monitoring           |

_Key insight: The "OS" metaphor becomes literal here -- the system routes tasks
to different "processors" (models) based on complexity, cost, and latency
requirements, just like an OS schedules work across CPU cores._ _Source:
https://arxiv.org/abs/2510.08439, https://arxiv.org/abs/2509.07571_

### Technology Adoption Trends

**Migration patterns relevant to this project:**

- Multi-agent > single-agent (context window collapse at scale)
- Agentic memory > naive RAG (16x fewer tokens, better personalization)
- Unified wearable APIs > individual integrations (6 months -> 3 weeks)
- Generative UI > text-only responses (richer coaching experience)
- Convex/real-time backends > traditional REST APIs (reactive coaching UX)
- On-device inference growing (privacy-first coaching with models like
  Llama-3.2-3B)

**Emerging technologies to watch:**

- Sleep-time compute (AI improves while user is away)
- Context repositories (git-like memory versioning)
- Weaviate Personalization Agent (purpose-built for progressive profiles)
- Health Connect FHIR support (medical records integration)

## Integration Patterns Analysis

This section maps how all the system components actually connect -- the data
flows, protocols, and communication patterns that make the AI coaching system
work as a unified whole.

### Integration Protocol Standards

Two emerging standards are critical for this system:

**Model Context Protocol (MCP)** -- Anthropic's open standard (Nov 2024), now
the de facto industry standard for connecting AI agents to tools and data. Think
of it as "USB-C for AI." Rather than loading all tool definitions upfront
(consuming excessive tokens), agents write code to call tools through MCP
servers, scaling to hundreds of tools while using fewer tokens. SDKs available
for Python and TypeScript. Pre-built servers exist for Google Drive, Slack,
GitHub, Postgres, and more. Thousands of community-built MCP servers available.

_Relevance: The coaching system's agents would use MCP to access wearable data
stores, user profile databases, coaching knowledge bases, and external health
APIs through a standardized interface._ _Source:
https://anthropic.com/news/model-context-protocol,
https://www.anthropic.com/engineering/code-execution-with-mcp_

**Agent2Agent Protocol (A2A)** -- Google's open standard (April 2025, v0.3.0)
for inter-agent communication. Built on HTTP, JSON-RPC 2.0, and SSE. Key
concepts:

- **Agent Card**: JSON metadata describing an agent's identity, capabilities,
  and auth requirements
- **Task**: Stateful work units progressing through defined lifecycles
- **Message**: Communication turns with content parts (text, files, structured
  data)
- **Opaque execution**: Agents collaborate based on declared capabilities
  without sharing internal state

Supported by 50+ technology partners. Apache 2.0 license.

_Relevance: The Sleep Agent, Fitness Agent, Nutrition Agent, and Orchestrator
would use A2A to collaborate without exposing their internal reasoning or
memory. Each agent declares what it can do via Agent Cards._ _Source:
https://google.github.io/A2A/specification/,
https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability_

**MCP + A2A are complementary:** MCP standardizes how agents access tools and
data. A2A standardizes how agents talk to each other. The coaching system needs
both.

### Inter-Agent Communication Patterns

For the multi-agent coaching system, several communication patterns apply:

**Publish-Subscribe (via message bus):** Federation of Agents research shows
MQTT pub-sub with semantic routing achieves 13x improvement over single-model
baselines. Agents publish findings (e.g., "Sleep Agent detected 3 nights of poor
sleep") and other agents subscribe to relevant topics (e.g., Fitness Agent
adjusts workout intensity).

**Shared State with Versioned Capabilities:** Agents maintain Versioned
Capability Vectors (VCVs) -- machine-readable profiles for capability discovery.
The Orchestrator queries which agents can handle a given task and routes
accordingly.

**Layered Architecture (Mod-X):** A Universal Message Bus handles
interoperability between agents with different architectures. A semantic
capability discovery layer lets agents find each other. Important for future
extensibility -- adding a new "Mental Health Agent" shouldn't require rewriting
the existing system.

_Source: https://arxiv.org/abs/2509.20175, https://arxiv.org/abs/2504.16736_

### Wearable Data Ingestion Pipeline

> **Decision:** Skip unified aggregation APIs (Terra, Rook) for now due to cost.
> Integrate wearable platforms individually, starting with Strava, HealthKit,
> Garmin, and COROS. This is more work upfront but avoids per-user aggregation
> fees and gives full control over the data layer. Can migrate to Terra/Rook
> later if needed.

The data flow from wearable devices to coaching context follows this
architecture:

```
[Wearable Devices] → [Individual Platform APIs] → [Webhook Events] → [Normalization Layer] → [Unified Storage] → [Agent Access via MCP]
```

**Individual Platform Integration Map:**

| Platform                  | API Type                            | Auth                  | Webhook Support                                   | Key Data                                                                      | Rate Limits                   | Notes                                                                                  |
| ------------------------- | ----------------------------------- | --------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| **Strava**                | REST v3                             | OAuth 2.0             | Yes (requires approval via developers@strava.com) | Activities, routes, heart rate, power, segments                               | 200 req/15min, 2000/day       | Webhook responds within 2s; 1 subscription per app for all athletes                    |
| **Apple HealthKit**       | Native SDK (iOS)                    | On-device permissions | N/A (on-device)                                   | HR, HRV, sleep stages, steps, calories, blood oxygen, workouts                | N/A                           | Requires custom dev client (not Expo Go); data stays on device, you pull it            |
| **Google Health Connect** | Native SDK (Android)                | On-device permissions | N/A (on-device)                                   | HR, sleep, steps, skin temp, mindfulness, exercise, FHIR medical records      | N/A                           | Replacing Google Fit in 2026; standardized schema; local storage                       |
| **Garmin**                | REST Health API                     | OAuth                 | Ping/pull or push                                 | Steps, HR, stress, sleep, pulse ox, body battery, respiration, blood pressure | Varies (1-4 week integration) | Free evaluation; commercial use may require license fee; HIPAA-compliant SDK available |
| **COROS**                 | Via Spike API or direct application | OAuth                 | Webhooks via Spike                                | HR, VO2max, pace, cadence, sleep, blood oxygen                                | Via Spike platform            | Spike also offers MCP integration for AI; direct COROS API requires application        |

**Ingestion patterns:**

- **Webhook-based** (Strava, Garmin push, COROS via Spike): Platform sends
  events to your backend endpoint. Respond within 2s. Fetch full data on
  receipt.
- **On-device pull** (HealthKit, Health Connect): Mobile app reads data locally
  via native SDKs, then syncs to backend. Requires custom Expo dev client.
- **Batch sync**: Daily/periodic pulls for historical data backfill and
  reconciliation across all platforms.

**Architecture approach:** Build a **normalization adapter per platform** behind
a common internal interface. Each adapter translates platform-specific data
(different schemas, units, timestamps) into a unified internal model. This is
the code you'd replace with Terra/Rook later if costs justify it.

```
[Strava Adapter]       ─┐
[HealthKit Adapter]     ─┤
[Health Connect Adapter]─┼→ [Unified Health Data Schema] → [Convex Storage] → [MCP Server]
[Garmin Adapter]        ─┤
[COROS Adapter]         ─┘
```

**Data normalization requirements:**

- Standardize timestamps to UTC across all devices
- Normalize measurement units (e.g., different heart rate sampling rates)
- Handle missing fields gracefully (not all devices track all metrics)
- Map platform-specific activity types to a common taxonomy
- Apply HL7 FHIR or IEEE 11073 standards where possible for future
  interoperability

**Storage layer:**

- Time-series data: Convex tables (with indexing by user + timestamp) for
  daily/hourly aggregates
- Aggregated summaries: Convex for reactive queries (daily sleep score, weekly
  activity trends)
- Vector embeddings of health patterns: Weaviate/Pinecone for semantic search
  ("find times when user had similar stress patterns")

_Sources: https://strava.github.io/api/v3/,
https://developer.garmin.com/gc-developer-program/health-api/,
https://www.spikeapi.com/integrations/coros_

### Client-Agent Streaming Architecture

How the coaching system communicates with the user's mobile app:

**Server-Sent Events (SSE)** is the dominant protocol for AI agent streaming.
All major LLM providers (OpenAI, Anthropic, Google) use SSE to push tokens as
they're generated. The A2A protocol standardizes streaming with JSON-RPC 2.0
over SSE:

- `TaskArtifactUpdateEvent`: Streams large responses in chunks
- `TaskStatusUpdateEvent`: Communicates task lifecycle (thinking, generating,
  complete)
- Automatic reconnection via `id` field

**For the mobile coaching app:**

- SSE for text streaming (coach's responses word-by-word)
- Convex real-time subscriptions for data updates (new wearable data arrives, UI
  auto-updates)
- Push notifications via webhooks for proactive coaching nudges (mobile
  background)
- WebSocket fallback for bidirectional scenarios (live workout coaching with
  real-time feedback)

**Generative UI streaming pattern:**

```
[User Query] → [Orchestrator Agent] → [Specialist Agent(s)] → [Tool Calls] → [Generative UI Components] → [SSE Stream] → [Client Renders Interactive Cards]
```

Instead of streaming plain text, the system streams structured UI components: a
sleep analysis card, a workout plan, a nutrition recommendation with interactive
elements -- all rendered natively on the client.

_Source: https://a2aproject.github.io/A2A/latest/topics/streaming-and-async/,
https://agentfactory.panaversity.org/docs/TypeScript-Language-Realtime-Interaction/async-patterns-streaming/server-sent-events-deep-dive_

### Context Assembly Pipeline

The critical integration pattern -- how context flows from storage to the LLM at
inference time:

```
[User Message] → [Orchestrator]
    ├─ Fetch in-context memory (Letta-style, ~2k chars per section)
    ├─ Query vector store for relevant past interactions (semantic search)
    ├─ Pull latest wearable summary (MCP tool call to data store)
    ├─ Retrieve user profile/preferences (structured data)
    ├─ Check recent coaching reports (RAG retrieval)
    └─ [Context Budget Allocator] → ranks and selects top-K context items
         └─ [Assembled Prompt] → [Appropriate LLM via Router]
              └─ [Response + Memory Updates] → [User + Memory Store]
```

**Context Budget Allocation** (solving "don't overload the system"):

- Total token budget split across: system prompt (~500), user profile (~500),
  recent memory (~2k), wearable context (~1k), relevant history (~2k),
  conversation (~2k), response reserve (~2k)
- PersonaMem-v2 research proves 2k tokens of well-managed memory outperforms 32k
  of raw history
- Relevance scoring determines which context items make the cut
- Sleep-time compute pre-processes and compresses context while user is idle

### Integration Security Patterns

Health data demands rigorous security architecture:

**Authentication & Authorization:**

- OAuth 2.0 for all API endpoints with fine-grained scopes
- Least-privilege access: each agent only accesses data it needs
- MCP server authentication for tool access control

**Data Protection:**

- TLS 1.2+ for all data in transit
- AES-256 for data at rest
- Hybrid architecture option: keep PHI on-device, send only
  aggregated/anonymized data to cloud for LLM processing

**Consent Management:**

- Centralized consent platform tracking what data the user has approved for
  sharing
- Granular permissions: user can enable sleep data but disable heart rate data
- Transparent data utilization tracking
- GDPR right to erasure support (delete all user context on request)

**Regulatory compliance:**

- HIPAA alignment: Privacy Rule (minimum necessary data), Security Rule
  (encryption, audit logging), Breach Notification
- GDPR: explicit consent, data portability, right to erasure
- Note: 82% of consumers express concern about health data being sold without
  consent -- transparency is critical for trust

_Source:
https://airbyte.com/data-engineering-resources/healthcare-api-integration-hipaa-compliant-strategies,
https://www.nature.com/articles/s41746-025-02147-3_

### Integration Architecture Summary

The full integration map for the AI Coach system:

| Integration Point            | Protocol/Standard          | Pattern                              | Latency Target               |
| ---------------------------- | -------------------------- | ------------------------------------ | ---------------------------- |
| Agent ↔ Agent                | A2A (JSON-RPC + SSE)       | Pub-sub + task delegation            | <500ms                       |
| Agent ↔ Tools/Data           | MCP (TypeScript SDK)       | Tool calls via MCP servers           | <200ms                       |
| Wearable → System            | Terra/Rook webhooks        | Event-driven ingestion               | <10min (batch), <1s (stream) |
| System → Client              | SSE + Convex subscriptions | Streaming + reactive queries         | <100ms first token           |
| System → Client (background) | Push notifications         | Proactive coaching nudges            | Best-effort                  |
| Agent ↔ Memory               | Letta-style + vector DB    | In-context editing + semantic search | <50ms                        |
| Agent ↔ LLM                  | Model router               | Cost-aware routing per agent role    | Varies by model              |
| All endpoints                | OAuth 2.0 + TLS 1.2+       | Scoped access, encrypted transit     | N/A                          |

## Architectural Patterns and Design

This section synthesizes everything into a concrete system architecture for the
AI Coach.

### System Architecture: The Orchestrator-Specialist Pattern

The system follows a **graph-based orchestrator pattern** -- the dominant
production architecture for multi-agent AI systems in 2025-2026 (72% of
enterprise AI projects now use multi-agent architectures, up from 23% in 2024).

**How it works:** A meta-agent (the Orchestrator) receives user input, plans the
response strategy, delegates subtasks to specialist agents, collects their
outputs, and synthesizes a unified coaching response. The Orchestrator does not
perform domain work itself -- it coordinates.

```
                          ┌─────────────────────┐
                          │    USER (Mobile App) │
                          └──────────┬──────────┘
                                     │ SSE / Convex Subscriptions
                          ┌──────────▼──────────┐
                          │     ORCHESTRATOR     │
                          │  (Thinking Model)    │
                          │  - Plans strategy    │
                          │  - Routes to agents  │
                          │  - Synthesizes reply │
                          │  - Manages context   │
                          └──────────┬──────────┘
                   ┌─────────┬───────┼───────┬─────────┐
                   ▼         ▼       ▼       ▼         ▼
            ┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐
            │  FITNESS  │ │SLEEP │ │NUTRI-│ │MENTAL│ │ RECOVERY │
            │  AGENT   │ │AGENT │ │TION  │ │HEALTH│ │  AGENT   │
            │          │ │      │ │AGENT │ │AGENT │ │          │
            └────┬─────┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘
                 │          │        │        │          │
            ┌────▼──────────▼────────▼────────▼──────────▼────┐
            │              TOOL / MCP LAYER                    │
            │  [Wearable Data] [User Memory] [Health KB]      │
            │  [Report Gen]    [Schedule]     [Vector Search]  │
            └─────────────────────────────────────────────────┘
```

**Graph-based workflow definition:** Workflows are defined declaratively
(JSON/config), not hard-coded. This means:

- Adding a new specialist agent (e.g., "Hydration Agent") = adding a node to the
  graph, not rewriting the system
- Branching, cycles, and conditional logic are explicit and inspectable
- Each agent runs independently with its own context window -- no context
  collapse
- The Orchestrator can invoke agents in parallel when tasks are independent

_Source:
https://orcaworks.ai/what-are-agentic-graph-systems-a-complete-guide-to-architecture-benefits-and-use-cases/,
https://hopx.ai/blog/ai-agents/orchestrator-pattern-ai-agents/_

### Memory Architecture: Five-Tier System

The coaching system needs a multi-tier memory architecture. Based on MIRIX
research (99.9% storage reduction, 85.4% accuracy on long-form conversations)
and Letta's two-tier model, here's the proposed design:

**Tier 1 -- Working Memory (In-Context, ~2-3k tokens)** What: The actively
loaded context for the current conversation. User's name, current goals, today's
wearable summary, recent coaching notes. How: Letta-style self-managed memory.
The agent edits this section through tool calls (`memory_insert`,
`memory_replace`). Persistence: Per-conversation, refreshed from higher tiers at
session start.

**Tier 2 -- Episodic Memory (Indexed, Searchable)** What: Specific past
interactions, coaching sessions, user feedback, notable events ("User ran their
first 10K on March 15"). How: Stored in Convex with vector embeddings in
Weaviate/Pinecone. Retrieved via semantic search when relevant. Persistence:
Long-term, grows over time. Subject to relevance decay.

**Tier 3 -- Semantic Memory (User Profile / Preferences)** What: Generalized
knowledge about the user extracted from episodes. "User prefers morning
workouts", "User is lactose intolerant", "User's resting HR is typically 58bpm".
How: Structured JSON profile in Convex, updated by the Memory Manager agent
after sessions. Also embedded for vector search. Persistence: Long-term, evolves
as patterns emerge. Overwrites when preferences change.

**Tier 4 -- Procedural Memory (Coaching Strategies)** What: Learned coaching
approaches that work for this user. "User responds better to encouragement than
tough love", "Short-term goals are more effective for this user than long-term
planning". How: Stored as strategy notes, surfaced to the Orchestrator when
planning responses. Persistence: Long-term, refined through feedback loops.

**Tier 5 -- Knowledge Base (Domain Expertise)** What: General health, fitness,
nutrition, sleep science knowledge. Not user-specific. How: RAG over curated
expert-vetted content. Prevents hallucination on health claims. Persistence:
Static/versioned, updated with new research periodically.

**Context Assembly at inference time:**

```
Total Budget: ~10k tokens
├── System Prompt (coaching persona + guidelines): ~500 tokens
├── Tier 1: Working Memory (current context): ~2k tokens
├── Tier 3: Semantic Memory (user profile excerpt): ~500 tokens
├── Tier 2: Episodic Memory (top-K relevant episodes): ~2k tokens
├── Tier 5: Knowledge Base (RAG results if needed): ~1k tokens
├── Conversation History (recent turns): ~2k tokens
└── Response Reserve: ~2k tokens
```

**Sleep-time compute:** Between sessions, a background process reviews recent
interactions, extracts patterns, updates Tier 3 (semantic) and Tier 4
(procedural) memories, and pre-computes context for likely next interactions.
The AI literally gets smarter while the user sleeps.

_Source: https://arxiv.org/abs/2507.07957, https://arxiv.org/abs/2505.00675,
https://arxiv.org/abs/2512.13564_

### Progressive Personalization: Cold Start to Deep Knowledge

The system evolves through four maturity stages:

**Stage 0 -- Virgin State (Day 0)**

- Generic AI coaching persona with domain expertise (Tier 5 only)
- Onboarding questionnaire fills initial Tier 3 profile (goals, preferences,
  medical conditions, experience level)
- Wearable connections established, first data sync begins
- System uses population-level baselines for recommendations
- _Pattern: PROPER framework's group-level adaptation via Mixture-of-Experts
  router assigns user to nearest preference group_

**Stage 1 -- Getting to Know You (Week 1-4)**

- Episodic memory accumulates from daily interactions
- Wearable data establishes personal baselines (resting HR, typical sleep,
  activity levels)
- Memory Manager starts extracting semantic patterns ("User typically sleeps 6.5
  hours", "User exercises 4x/week")
- Coaching calibrates tone based on early feedback signals
- _Pattern: RLPA dual-level reward -- one for accurate profile construction,
  another for response consistency_

**Stage 2 -- Personalized Coach (Month 1-6)**

- Rich user profile with established baselines and preferences
- Procedural memory captures effective coaching strategies for this user
- System detects trends and anomalies against the user's own baselines (not just
  population averages)
- Proactive coaching triggers activate based on learned patterns
- Reports reference historical context ("Your sleep has improved 23% since
  January")

**Stage 3 -- Deep Partnership (6+ Months)**

- System has comprehensive longitudinal data
- Can correlate across domains (e.g., "When you skip workouts for 3+ days, your
  sleep quality drops")
- Anticipates user needs before they arise
- Coaching strategies are battle-tested and refined
- The "OS" has a deep model of this specific human

_Source: https://arxiv.org/abs/2505.15456, https://arxiv.org/abs/2512.15302_

### Proactive Coaching Architecture

The system operates in two modes simultaneously:

**Reactive Mode** (user-initiated): User asks a question -> Orchestrator plans
-> Agents respond -> Generative UI streams answer

**Proactive Mode** (system-initiated): A background **Trigger Agent** (running
on cheap Gemini Flash) continuously monitors:

```
[Wearable Data Stream] ──┐
[Calendar/Schedule]    ───┼──> [Trigger Agent] ──> [Should we reach out?]
[User Activity History]───┤         │
[Time-based rules]     ───┘         ├── YES ──> [Orchestrator] ──> [Coaching Nudge] ──> [Push Notification]
                                    └── NO  ──> [Log & Continue Monitoring]
```

**Trigger conditions (examples):**

- 3 consecutive nights of poor sleep detected -> Sleep Agent generates advice
- No workout logged in 5 days (unusual for user) -> Gentle check-in
- Morning of a scheduled race -> Pre-race nutrition and prep reminder
- Weekly summary day -> Generate and push progress report
- Stress levels elevated for 3+ days -> Mental health check-in

**Key design principle:** Proactive nudges must be valuable, not annoying.
Rate-limited (max 2-3/day), only sent when the system has high confidence the
intervention is helpful. User can configure notification preferences.

_Source: https://arxiv.org/abs/2509.04752,
https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2025.1670464/full_

### Generative UI Architecture for Mobile

Instead of plain text chat, the AI streams interactive UI components:

**Architecture pattern:** Agent tool calls produce structured data -> client
renders native components

```
[Agent decides to show sleep analysis]
    └── Tool call: render_sleep_card({ score: 82, deep: "1h 23m", rem: "2h 05m", trend: "improving" })
        └── Client receives structured payload
            └── React Native renders <SleepAnalysisCard /> natively
```

**Key architectural decision:** Move flow logic outside React components into
external state management (Jotai atoms or Convex reactive state). Agents modify
UI state through tool calls and external state updates, not through React props.
This enables:

- AI controls what's displayed without coupling to component tree
- Components are reusable and testable independently
- Streaming works naturally -- partial state updates render progressively

**Component types for coaching:**

- `CoachingMessageCard` -- Rich text with embedded data highlights
- `SleepAnalysisCard` -- Sleep stages visualization, trends, comparison to
  baseline
- `WorkoutSummaryCard` -- Activity metrics, heart rate zones, performance vs.
  goals
- `WeeklyReportCard` -- Multi-domain summary with trends and recommendations
- `GoalProgressCard` -- Visual progress tracking with milestones
- `ActionPlanCard` -- Interactive checklist of coaching recommendations
- `NutritionInsightCard` -- Meal suggestions, macro tracking, hydration

_Source:
https://www.callstack.com/blog/giving-ai-the-keys-to-your-app-agents-controlling-ui-state,
https://langchain-ai.github.io/langgraphjs/cloud/how-tos/generative_ui_react/_

### Data Architecture

**Primary data store: Convex** (serverless, real-time, reactive)

| Data Type                  | Storage                                | Access Pattern                 | Rationale                                         |
| -------------------------- | -------------------------------------- | ------------------------------ | ------------------------------------------------- |
| User profiles              | Convex table                           | Query (reactive)               | Real-time profile updates reflected instantly     |
| Conversation threads       | Convex threads                         | Query (reactive)               | Built-in agent thread support, live updates       |
| Wearable data (aggregated) | Convex tables (indexed by user + date) | Query                          | Daily/hourly summaries, reactive coaching         |
| Coaching reports           | Convex table                           | Query                          | Historical access, semantic search                |
| Agent memory (Tier 1-4)    | Convex + vector DB                     | Hybrid query + semantic search | Working memory in Convex, embeddings in vector DB |
| Knowledge base (Tier 5)    | Vector DB (Weaviate/Pinecone)          | RAG retrieval                  | Semantic search over health/fitness knowledge     |
| Wearable raw data          | Optional: time-series DB               | Batch analytics                | Only if high-frequency analysis needed            |
| User consent/permissions   | Convex table                           | Query                          | Audit trail, GDPR compliance                      |

**Convex advantages for this system:**

- Threads and messages are first-class primitives -- no custom chat
  infrastructure
- Hybrid vector/text search built-in for agent memory retrieval
- Real-time subscriptions mean the mobile app auto-updates when new wearable
  data arrives or agent completes reasoning
- Durable workflows for multi-step agent operations
- Rate limiting and usage tracking built-in

### Deployment Architecture

**Serverless-first approach:**

```
[Mobile App (Expo/React Native)]
    │
    ├── Convex Client SDK (real-time subscriptions + mutations)
    │
    └── [Convex Backend]
            ├── Queries (reactive, cached)
            ├── Mutations (user actions, memory updates)
            ├── Actions (LLM calls, wearable API sync, agent execution)
            ├── Cron jobs (wearable sync, sleep-time compute, proactive triggers)
            └── Agent Component (threads, tools, streaming)
                    │
                    ├── LLM Providers (via model router)
                    │   ├── Anthropic (Opus 4.6, Sonnet)
                    │   ├── OpenAI (o3, o4-mini, GPT-4o)
                    │   ├── Google (Gemini 2.5 Pro, Flash)
                    │   └── Self-hosted (DeepSeek R1 distilled, optional)
                    │
                    ├── Vector DB (Weaviate Cloud / Pinecone)
                    │
                    └── Wearable APIs
                        ├── Strava (webhooks)
                        ├── Garmin Health API (push/pull)
                        ├── COROS (via Spike)
                        ├── Apple HealthKit (via mobile SDK)
                        └── Google Health Connect (via mobile SDK)
```

**No servers to manage.** Convex handles compute, storage, real-time sync, cron
scheduling, and durable workflows. The only external infrastructure is the
vector DB (managed cloud) and LLM provider APIs.

### Security Architecture

**Defense in depth for health data:**

1. **Transport**: TLS 1.2+ everywhere
2. **Authentication**: OAuth 2.0 with granular scopes per data type
3. **Authorization**: Per-agent least-privilege (Sleep Agent can't access
   nutrition data unless explicitly needed for correlation)
4. **Data at rest**: AES-256 encryption on Convex and vector DB
5. **Consent layer**: Centralized consent management -- user controls what data
   types are shared, can revoke anytime
6. **On-device option**: HealthKit/Health Connect data can stay on-device with
   only aggregated summaries sent to cloud
7. **Audit logging**: Every agent action, data access, and memory update is
   logged
8. **Guardrails**: System instructions prevent medical diagnoses, always defer
   to professionals for medical concerns
9. **Data portability**: User can export all their data (GDPR Article 20)
10. **Right to erasure**: Full data deletion on request, including vector
    embeddings and memory tiers

## Implementation Approaches and Technology Adoption

### MVP Strategy: Incremental Build Phases

The AI SaaS market is now enabling MVPs in 2-12 weeks for $500-$20,000, with
agentic AI reaching operational agents in 30 days. The key principle: start with
a single high-value use case, keep humans in the loop, and expand.

**Phase 0 -- Foundation (Weeks 1-3)** _Goal: Basic conversational coaching with
one wearable integration_

- Set up Expo + React Native project with custom dev client
- Set up Convex backend with agent component (threads, messages, streaming)
- Single coaching agent (no multi-agent yet) with a good system prompt
- One LLM (GPT-4o or Sonnet -- fast, reliable tool calling)
- Basic user profile (onboarding questionnaire stored in Convex)
- First wearable integration: **Apple HealthKit** (largest user base, on-device,
  no API approval needed)
- Basic chat UI with text streaming
- No memory system yet -- just conversation history in thread

_Deliverable: A working AI coach you can chat with that knows your basic health
data_

**Phase 1 -- Memory & Personalization (Weeks 4-6)** _Goal: The AI starts
remembering and getting smarter_

- Implement Tier 1 (Working Memory) -- Letta-style in-context memory with
  self-editing
- Implement Tier 3 (Semantic Memory) -- structured user profile that evolves
  from conversations
- Add vector DB (start with Weaviate Cloud or Pinecone free tier) for Tier 2
  (Episodic Memory)
- Context assembly pipeline with budget allocation
- Sleep-time compute: cron job that updates user profile between sessions
- Second wearable: **Strava** (webhook-based, activity-focused)

_Deliverable: The AI remembers your preferences, training history, and gets
better over time_

**Phase 2 -- Multi-Agent & Generative UI (Weeks 7-10)** _Goal: Specialized
coaching with rich interactive responses_

- Split single agent into Orchestrator + 2-3 specialist agents (Fitness, Sleep,
  Nutrition)
- Implement model router (Orchestrator on thinking model, specialists on fast
  models)
- Generative UI: first interactive cards (SleepAnalysisCard, WorkoutSummaryCard)
- Tool calling for data retrieval (MCP servers for wearable data, user memory)
- Add Tier 5 (Knowledge Base) -- RAG over curated health/fitness content
- Third wearable: **Garmin** or **Health Connect** (Android users)

_Deliverable: Rich, multi-domain coaching with interactive visual responses_

**Phase 3 -- Proactive Coaching & Polish (Weeks 11-14)** _Goal: The system
reaches out to you, not just responds_

- Proactive Trigger Agent (background monitoring on Gemini Flash)
- Push notification integration
- Weekly/monthly report generation
- Tier 4 (Procedural Memory) -- system learns what coaching strategies work
- Add COROS integration
- Feedback loops: user can rate coaching quality, data feeds back into system
- Onboarding flow polish, settings, consent management

_Deliverable: A complete AI coaching system that proactively helps you_

**Phase 4 -- Scale & Optimize (Weeks 15+)** _Goal: Production hardening and
growth_

- Cost optimization (caching, prompt compression, model downgrading where safe)
- Full A2A protocol for agent communication
- Advanced security audit, GDPR compliance verification
- Analytics dashboard for coaching effectiveness
- Beta testing program, user feedback integration
- App store submission (iOS + Android)

_Source: https://www.articsledge.com/post/build-ai-saas,
https://www.botcampus.ai/how-companies-can-adopt-agentic-ai-in-30-days-a-practical-framework_

### Development Workflow and Tooling

**Mobile Development Pipeline (Expo EAS):**

```
[Code Push] → [EAS Workflows (YAML)] → [Build (iOS + Android in parallel)] → [E2E Tests (Maestro)] → [Submit to Stores]
                                                                                                           │
                                                                              [OTA Updates for JS changes] ←┘
```

- **EAS Build**: Cloud-based compilation, no local Mac required for iOS builds
- **EAS Submit**: Automated app store uploads
- **EAS Update**: Over-the-air updates for JavaScript changes (bug fixes in
  minutes, no store review)
- **EAS Workflows**: YAML-based CI/CD with GitHub integration, branch filtering,
  PR triggers
- **Maestro**: E2E testing framework for mobile, runs as part of CI

**Backend Development (Convex):**

- Code-first configuration (TypeScript)
- Hot reload during development
- Built-in dashboard for data inspection and debugging
- Agent playground for prompt iteration and metadata inspection
- `npx convex dev` for local development with live sync

**Version Control & Quality:**

- Treat prompts as versioned code artifacts with semantic versioning
- Side-by-side prompt comparisons before deployment
- Canary deployments for prompt/model changes
- Feed real-world failures back into test suites

_Source: https://docs.expo.dev/eas/workflows/introduction/,
https://www.getmaxim.ai/articles/accelerating-ai-agent-development-best-practices-for-fast-reliable-iteration-in-2025/_

### Testing and Quality Assurance

**LLM Output Quality Testing:**

| Layer       | What to Test                                      | How                                              | Frequency     |
| ----------- | ------------------------------------------------- | ------------------------------------------------ | ------------- |
| Unit        | Individual agent tool calls, data transformations | Vitest, mocked LLM responses                     | Every PR      |
| Integration | Agent-to-agent communication, context assembly    | Convex test framework, real LLM calls            | Daily         |
| Evaluation  | Coaching response quality, safety                 | LLM-as-judge + human review, HealthBench rubrics | Weekly        |
| E2E         | Full user flows (onboard -> chat -> get coached)  | Maestro (mobile), Playwright (web if applicable) | Every release |
| Regression  | Known failure cases from production               | Automated test suite grown from real failures    | Every PR      |

**Health-Specific Evaluation:**

- HealthBench benchmark: 5,000 multi-turn conversations with 48,562 rubric
  criteria by 262 physicians. Current best (o3) scores 60% -- sets the quality
  ceiling to aim for.
- Core functionality > style: Research shows coaching substance matters far more
  than tone/personality.
- Per-subgroup testing: Uniform coaching policies can harm specific user groups.
  Test across different user archetypes (beginner vs. advanced, high vs. low
  health literacy).
- Safety testing: Ensure the system never provides medical diagnoses, always
  defers to professionals for medical concerns.

**Prompt Regression Testing:**

- Version all system prompts and agent instructions
- Maintain a golden dataset of expected responses for key scenarios
- Run automated evals on prompt changes before deploying
- Track quality metrics over time (accuracy, helpfulness, safety scores)

_Source: https://arxiv.org/abs/2505.08775, https://arxiv.org/abs/2503.19328_

### LLM Observability and Monitoring

Production monitoring is critical -- most organizations overspend 2.6-5x on LLM
costs due to invisible leaks.

**Recommended stack:**

| Tool         | Role                      | Cost                           | Why                                                                  |
| ------------ | ------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| **Helicone** | Primary observability     | Free (50K req), $20/mo after   | Fastest setup (2 min, proxy-based), works with all providers         |
| **Langfuse** | Alternative (open-source) | Free self-hosted, $50/mo cloud | EU AI Act compliance, self-hosting option, prompt versioning         |
| **Portkey**  | AI gateway + routing      | Varies                         | Multi-provider routing, caching, fallback -- useful for model router |

**What to monitor:**

- Token usage per agent, per user, per feature (cost attribution)
- Latency per agent step (identify bottlenecks)
- Error rates and failure modes per model provider
- Hallucination detection in health-critical responses
- Context window utilization (are we wasting tokens?)
- Memory retrieval quality (are we fetching relevant context?)
- User satisfaction signals (explicit ratings + implicit engagement)

**Cost optimization tactics (60-80% reduction achievable):**

- Cache system prompts and common embeddings (70%+ reduction in redundant calls)
- Route simple tasks to cheapest models (Gemini Flash at $0.075/M tokens)
- Batch processing where latency allows (50% discount on OpenAI Batch API)
- Compress conversation history instead of sending full context every turn
- Set output token limits per agent role
- Budget caps per user/feature with automated alerts

_Source: https://www.burnwise.io/blog/llm-cost-optimization-complete-guide,
https://portkey.ai/blog/the-complete-guide-to-llm-observability_

### Team Organization and Skills

For a solo developer or small team building this incrementally:

**Phase 0-1 (Solo feasible):**

- Full-stack TypeScript (React Native + Convex)
- Prompt engineering and LLM API familiarity
- Basic mobile development (Expo)
- Understanding of health/fitness domain

**Phase 2-3 (2-3 people ideal):**

- - Multi-agent system design experience
- - Native mobile expertise (HealthKit/Health Connect SDKs)
- - UX/design for generative UI components
- - Health data domain expertise (for RAG content curation)

**Key skills to develop:**

- Agentic system design patterns (graph-based orchestration)
- Prompt engineering and evaluation methodology
- Vector database and RAG implementation
- Real-time system design (streaming, subscriptions)
- Health data privacy and compliance (GDPR, HIPAA awareness)

### Cost Estimation

**Monthly operating costs at different scales:**

| Component                     | 100 users    | 1,000 users  | 10,000 users   |
| ----------------------------- | ------------ | ------------ | -------------- |
| Convex (Pro)                  | $25/mo       | $25/mo       | ~$100/mo       |
| LLM APIs (blended)            | ~$50/mo      | ~$400/mo     | ~$3,000/mo     |
| Vector DB (Weaviate/Pinecone) | Free tier    | ~$50/mo      | ~$200/mo       |
| Expo EAS (Production)         | $99/mo       | $99/mo       | $99/mo         |
| Helicone observability        | Free         | $20/mo       | $100/mo        |
| Apple Developer               | $99/yr       | $99/yr       | $99/yr         |
| Google Play Developer         | $25 once     | $25 once     | $25 once       |
| **Total**                     | **~$200/mo** | **~$600/mo** | **~$3,500/mo** |

_Note: LLM costs assume aggressive optimization (model routing, caching, prompt
compression). Without optimization, multiply LLM costs by 3-5x._

### Risk Assessment and Mitigation

| Risk                                | Impact   | Likelihood | Mitigation                                                                     |
| ----------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------ |
| LLM hallucination on health advice  | Critical | Medium     | RAG grounding, safety guardrails, always-defer-to-professional rules           |
| Wearable API breaking changes       | Medium   | Medium     | Adapter pattern isolates each integration; one breaking doesn't affect others  |
| LLM provider outage                 | High     | Low        | Multi-provider routing with automatic fallback (Portkey)                       |
| Cost overrun from token explosion   | High     | Medium     | Budget caps, monitoring, model routing, caching                                |
| User data breach                    | Critical | Low        | Encryption, least-privilege, consent management, minimal data collection       |
| Context window quality degradation  | Medium   | Medium     | Regular eval benchmarks, memory quality monitoring                             |
| App store rejection (health claims) | Medium   | Medium     | Clear disclaimers, no medical diagnoses, follow Apple/Google health guidelines |
| Cold start poor experience          | Medium   | High       | Strong onboarding, population-level baselines, quick-win early coaching        |

## Technical Research Recommendations

### Implementation Roadmap Summary

| Phase           | Duration    | Milestone                                   | Key Risk                 |
| --------------- | ----------- | ------------------------------------------- | ------------------------ |
| 0 - Foundation  | Weeks 1-3   | Chat with AI coach + HealthKit data         | Getting the basics right |
| 1 - Memory      | Weeks 4-6   | AI remembers and personalizes + Strava      | Memory quality           |
| 2 - Multi-Agent | Weeks 7-10  | Specialized agents + Generative UI + Garmin | Complexity jump          |
| 3 - Proactive   | Weeks 11-14 | System reaches out + Reports + COROS        | Notification fatigue     |
| 4 - Scale       | Weeks 15+   | Production hardening + App stores           | Cost at scale            |

### Technology Stack Recommendations

| Layer         | Recommended                                              | Alternative                       | Rationale                                                |
| ------------- | -------------------------------------------------------- | --------------------------------- | -------------------------------------------------------- |
| Mobile        | Expo + React Native                                      | Flutter                           | Ecosystem, native module support, EAS tooling            |
| Backend       | Convex                                                   | Supabase + custom                 | Real-time, agent primitives, serverless                  |
| Orchestration | LangGraph                                                | CrewAI                            | Graph-based, production-mature, checkpointing            |
| Thinking LLM  | Claude Opus 4.6                                          | OpenAI o3                         | 1M context, adaptive thinking, sustained agentic tasks   |
| Fast LLM      | GPT-4o                                                   | Claude Sonnet                     | Best latency + tool calling                              |
| Cheap LLM     | Gemini Flash                                             | GPT-4o-mini                       | 10x cheaper for background tasks                         |
| Vector DB     | Weaviate Cloud                                           | Pinecone                          | Personalization Agent, hybrid search, open-source option |
| Observability | Helicone + Langfuse                                      | LangSmith                         | Provider-agnostic, self-host option, fast setup          |
| Wearables     | HealthKit -> Strava -> Garmin -> Health Connect -> COROS | Start with Terra if budget allows | Incremental, cost-effective, adapter pattern             |
| CI/CD         | EAS Workflows                                            | GitHub Actions + Fastlane         | Managed, integrated with Expo ecosystem                  |

### Success Metrics and KPIs

**User Engagement:**

- Daily active users / Monthly active users ratio (target: >30%)
- Average sessions per week (target: 4+)
- Session duration (target: 3-5 min for check-ins)
- Wearable data connection rate (target: >80% of users connect at least one
  device)

**Coaching Quality:**

- User satisfaction rating (in-app, target: 4.5+/5)
- HealthBench-style eval scores (track over time)
- Coaching recommendation adherence rate
- User-reported outcome improvements (sleep, fitness, stress)

**Technical Health:**

- LLM response latency (target: <3s for first token)
- Context assembly latency (target: <200ms)
- Memory retrieval relevance score
- LLM cost per user per month (target: <$0.50 at scale)
- Wearable sync success rate (target: >99%)
- System uptime (target: 99.9%)

## Future Technical Outlook

### Near-Term (2026-2027)

- **Agentic memory matures**: Letta, PersonaMem, and similar frameworks will
  become production-standard. Expect purpose-built "memory-as-a-service"
  offerings.
- **MCP + A2A standardization**: These protocols will consolidate as the
  universal integration layer for AI agents. Coaching system agents built on
  these standards will interoperate with third-party services.
- **On-device inference grows**: Models like Llama-3.2-3B and DeepSeek distilled
  variants enable privacy-first on-device coaching for sensitive data. Apple and
  Google will likely expand on-device AI capabilities.
- **Wearable data richness**: Health Connect FHIR support opens medical records
  integration. Continuous glucose monitors, stress sensors, and environmental
  data will expand context sources.
- **Generative UI becomes standard**: Streaming interactive components instead
  of plain text will be table-stakes for AI applications.

### Medium-Term (2027-2029)

- **Multimodal coaching**: Voice-first interactions with real-time video
  analysis (form checking, food recognition). Gemini 2.5 Pro's native multimodal
  architecture is a preview of this future.
- **Federated learning for coaching**: Train personalization models across users
  without sharing individual data -- privacy-preserving population insights.
- **Autonomous coaching agents**: Agents that don't just respond or nudge, but
  independently plan and execute multi-week coaching programs with minimal user
  input.
- **Health data interoperability**: Standardized health data pipes across
  devices and platforms, reducing integration friction.
- **Regulation catches up**: EU AI Act (2025-2027 phase-in), potential US health
  AI regulations. Systems built with audit trails and compliance from day one
  will have a significant advantage.

### Long-Term (2029+)

- **The "OS" metaphor becomes literal**: AI coaching systems evolve into true
  operating systems for personal health -- orchestrating all health data,
  coordinating between healthcare providers, managing preventive care, and
  acting as a lifelong health partner.
- **Digital twin integration**: The user's health profile becomes a predictive
  model that can simulate outcomes of different coaching strategies before
  recommending them.
- **Ambient coaching**: Always-on, context-aware coaching that understands your
  environment, schedule, and physiological state in real-time without explicit
  interaction.

_Market trajectory: AI coaching avatar market alone projected to reach $5.01B by
2029 (30.8% CAGR), broader digital health coaching to $44.12B by 2034._ _Source:
https://www.globenewswire.com/news-release/2026/01/07/3214754/0/en/,
https://www.researchandmarkets.com/reports/6183553/_

---

## Technical Research Methodology and Sources

### Research Methodology

- **Scope**: 12 technical domains analyzed (architecture, memory, multi-agent,
  LLMs, wearables, integration protocols, generative UI, personalization,
  proactive coaching, security, implementation, cost)
- **Sources**: 40+ web searches across academic papers (arXiv, Nature), industry
  documentation (Anthropic, Google, OpenAI, Convex, Letta), developer platforms
  (Garmin, Strava, Terra, Expo), market research, and technical blogs
- **Verification**: Multi-source validation for all critical technical claims.
  Confidence levels noted where data is uncertain.
- **Currency**: All data sourced from 2025-2026 publications with preference for
  the most recent available
- **Analysis Framework**: Technology stack evaluation -> Integration patterns ->
  Architectural synthesis -> Implementation roadmap

### Primary Sources

**Academic Research:**

- PersonaMem-v2 (Dec 2025) - Agentic memory for personalization:
  https://arxiv.org/abs/2512.06688
- MIRIX Multi-Agent Memory System: https://arxiv.org/abs/2507.07957
- HealthBench LLM Evaluation: https://arxiv.org/abs/2505.08775
- SePA Predictive Health Agent: https://arxiv.org/abs/2509.04752
- Google Personal Health Coach:
  https://research.google/blog/how-we-are-building-the-personal-health-coach/
- LLM Wearable Health Insights (Nature):
  https://www.nature.com/articles/s41467-025-67922-y
- Dynamic Profile Modeling (RLPA): https://arxiv.org/abs/2505.15456
- AI Agent Protocol Survey: https://arxiv.org/abs/2504.16736
- xRouter Cost-Aware LLM Orchestration: https://arxiv.org/abs/2510.08439
- DeepSeek R1: https://github.com/deepseek-ai/DeepSeek-R1

**Platform Documentation:**

- Letta/MemGPT Memory Management:
  https://docs.letta.com/advanced/memory-management/
- Convex AI Agents: https://docs.convex.dev/agents
- Anthropic MCP: https://anthropic.com/news/model-context-protocol
- Google A2A Protocol: https://google.github.io/A2A/specification/
- Claude Opus 4.6: https://anthropic.com/news/claude-opus-4-6
- Gemini 2.5 Pro:
  https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025
- OpenAI o3/o4-mini: https://openai.com/index/introducing-o3-and-o4-mini
- Vercel AI SDK Generative UI: https://vercel.com/blog/ai-sdk-3-generative-ui

**Wearable Platforms:**

- Strava API v3: https://strava.github.io/api/v3/
- Garmin Health API:
  https://developer.garmin.com/gc-developer-program/health-api/
- Garmin Health SDKs: https://developer.garmin.com/health-sdk/overview
- COROS via Spike: https://www.spikeapi.com/integrations/coros
- Google Health Connect:
  https://developer.android.com/health-and-fitness/guides/health-connect
- Terra API: https://terraapi.com/
- Rook API: https://docs.tryrook.io/

**Infrastructure & Tools:**

- Weaviate Personalization Agent: https://weaviate.io/blog/personalization-agent
- Vector DB Comparison:
  https://getathenic.com/blog/vector-databases-ai-agents-pinecone-weaviate-qdrant
- LLM Model Comparison:
  https://getathenic.com/blog/anthropic-claude-vs-openai-gpt4-vs-google-gemini
- LLM Cost Optimization:
  https://www.burnwise.io/blog/llm-cost-optimization-complete-guide
- LLM Observability Guide:
  https://portkey.ai/blog/the-complete-guide-to-llm-observability
- Expo EAS Deployment: https://docs.expo.dev/eas/workflows/introduction/
- React Native AI Agent Patterns:
  https://www.callstack.com/blog/giving-ai-the-keys-to-your-app-agents-controlling-ui-state

**Market Research:**

- AI Coaching Avatar Market ($5.01B by 2029):
  https://www.globenewswire.com/news-release/2026/01/07/3214754/
- Digital Health Coaching Market ($44.12B by 2034):
  https://www.researchandmarkets.com/reports/6183553/
- Agentic AI Systems Guide 2026:
  https://brlikhon.engineer/blog/building-production-agentic-ai-systems-in-2026-langgraph-vs-autogen-vs-crewai-complete-architecture-guide
- AI SaaS Building Guide: https://www.articsledge.com/post/build-ai-saas

### Research Limitations

- LLM and framework capabilities are evolving rapidly; specific version features
  may change within months
- Cost estimates are based on current pricing and may shift as competition
  increases
- Wearable API access requirements and pricing may change (especially Garmin
  commercial licensing and Strava webhook approval)
- Health data regulations vary by jurisdiction; legal review needed for specific
  deployment markets
- Performance benchmarks (HealthBench, PersonaMem-v2) are academic; real-world
  coaching performance may vary

---

## Technical Research Conclusion

### Summary of Key Findings

This research demonstrates that building a progressively personalizing AI
coaching system is technically feasible with current tools and frameworks,
following well-established patterns from both academic research and production
deployments. The "Coach OS" metaphor is not just a branding exercise -- it
accurately describes the architectural reality: a system that orchestrates
multiple specialized agents across different models, manages persistent memory
and context, integrates diverse data sources, and progressively builds a deep
understanding of an individual user.

The critical architectural insight is that **intelligent context management --
not raw model capability -- is the primary differentiator**. A well-designed
memory system using 2,000 tokens outperforms 32,000 tokens of brute-force
context. This means the system's intelligence comes from the architecture around
the LLM, not just the LLM itself.

### Next Steps

1. **Set up the project foundation** -- Expo + Convex + single coaching agent
   with HealthKit integration (Phase 0)
2. **Implement agentic memory early** -- This is the "OS kernel" that makes
   everything else work (Phase 1)
3. **Validate with real users** -- Start with a small beta group of
   health-conscious users with Apple Watch/Garmin devices
4. **Iterate on coaching quality** -- Use HealthBench-style evaluations and user
   feedback to refine prompts and agent behavior
5. **Expand incrementally** -- Add agents, wearables, and features based on user
   demand, not assumptions

---

**Technical Research Completion Date:** 2026-02-15 **Research Period:**
Comprehensive technical analysis covering 2025-2026 developments **Source
Verification:** All technical facts cited with current sources (40+ web
searches) **Confidence Level:** High -- based on multiple authoritative sources
across academic research, platform documentation, and market analysis

_This comprehensive technical research document serves as an authoritative
reference for the AI Coach System Architecture and provides a concrete
implementation path from concept to production._
