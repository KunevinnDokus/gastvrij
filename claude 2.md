# Claude.md: Design-First TDD with AI Subagents

> **Quick Start**: For immediate development, jump to [Daily Workflow](#daily-workflow) | [Subagent Commands](#subagent-commands)

A streamlined development methodology combining Design-First TDD with specialized AI subagents for building modern Next.js applications.

## Core Philosophy

**Design → Test → Build → Optimize → Review**

- **User-centered design** drives all development decisions
- **Tests define requirements** before any implementation
- **Subagent specialization** handles complex cross-cutting concerns
- **Continuous optimization** through automated quality gates

## Technology Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 14+ App Router + TypeScript | Server Components, automatic optimizations, superior SEO |
| **UI** | shadcn/ui + Tailwind CSS | Copy-paste components, excellent AI integration |
| **Database** | PostgreSQL + Prisma | Type-safe ORM, robust testing, excellent migration tools |
| **Testing** | Vitest + Playwright + RTL + MSW | 3x faster than Jest, zero config, full Next.js support |
| **Deployment** | Vercel + Neon PostgreSQL | Optimized for Next.js, database branching for testing |
| **Package Manager** | pnpm | 70% disk space savings, phantom dependency prevention |

## Project Structure

```
project-root/
├── .claude/subagents/          # AI specialist definitions
├── docs/                       # Architecture & specs
├── tasks/                      # Task tracking & prompts
│   ├── todo.md                # Active tasks with timestamps
│   └── tasks.md               # Task breakdown
├── logs/prompts.md            # Prompt history & optimization
├── src/
│   ├── app/                   # Next.js App Router
│   ├── components/            # UI components
│   ├── lib/                   # Utilities & logic
│   └── types/                 # TypeScript definitions
├── tests/                     # Test organization
│   ├── unit/                  # Pure function tests
│   ├── integration/           # API & component tests
│   └── e2e/                   # End-to-end scenarios
└── prisma/                    # Database schema & migrations
```

## Subagent Architecture

Six specialized AI assistants orchestrate the development workflow:

- **[Prompting Expert](.claude/subagents/prompting-expert.md)** - Optimize prompts, model selection, cost efficiency
- **[UI Designer](.claude/subagents/ui-designer.md)** - Design systems, accessibility, responsive interfaces, i18n compliance  
- **[Test Architect](.claude/subagents/test-architect.md)** - Test strategy, comprehensive coverage, quality gates
- **[Next.js Developer](.claude/subagents/nextjs-dev.md)** - Implementation, Server/Client Components, API routes
- **[Security Auditor](.claude/subagents/security-auditor.md)** - Vulnerability assessment, OWASP compliance
- **[Performance Optimizer](.claude/subagents/performance-optimizer.md)** - Core Web Vitals, bundle optimization
- **[Code Reviewer](.claude/subagents/code-reviewer.md)** - Quality assurance, architectural consistency

## Daily Workflow

### Simple Tasks (70% of work)
```bash
# Direct execution - no optimization needed
cursor chat "@nextjs-dev fix the button alignment in LoginForm component"
cursor chat "@ui-designer update color scheme to match brand guidelines with i18n text expansion considerations"
```

### Complex Tasks (30% of work)
```bash
# Step 0: Optimization (for multi-subagent tasks)
cursor chat "@prompting-expert optimize: 'Build user authentication with JWT, email verification, and proper security'"

# Step 1: Design Foundation
cursor chat "@ui-designer create authentication flow design system with accessibility and i18n compliance"

# Step 2: Test Strategy  
cursor chat "@test-architect design comprehensive auth tests covering security edge cases"

# Step 3: Implementation
cursor chat "@nextjs-dev implement authentication following design and test specifications"

# Step 4: Quality Gates
cursor chat "@security-auditor comprehensive security audit including database-UI consistency validation"
cursor chat "@performance-optimizer review implementation performance"
cursor chat "@code-reviewer final quality and consistency review"
```

## Subagent Commands

### Design & Planning
```bash
# UI/UX Foundation
cursor chat "@ui-designer create responsive dashboard layout with mobile-first approach and i18n text expansion"
cursor chat "@ui-designer design component library with WCAG 2.1 AA compliance and multilingual support"

# Test Strategy
cursor chat "@test-architect design test suite for [feature] with 80%+ coverage including i18n edge cases"
cursor chat "@test-architect create integration tests for API endpoints with multilingual data validation"
```

### Implementation
```bash
# Feature Development
cursor chat "@nextjs-dev implement [feature] with Server Components, proper error handling, and i18n integration"
cursor chat "@nextjs-dev create API route for [endpoint] with Zod validation, Prisma, and multilingual response support"

# Database Operations
cursor chat "@nextjs-dev setup Prisma schema for [data model] with migrations"
```

### Quality Assurance
```bash
# Security Review
cursor chat "@security-auditor audit [component] for OWASP compliance and input validation"

# Performance Optimization  
cursor chat "@performance-optimizer analyze [feature] for Core Web Vitals and bundle size"

# Code Quality
cursor chat "@code-reviewer review [implementation] for patterns, maintainability, and i18n completeness"
```

### Meta-Optimization
```bash
# Prompt Optimization (for complex tasks only)
cursor chat "@prompting-expert optimize: '[complex-prompt]'"
cursor chat "@prompting-expert recommend cost-effective approach for [large-feature]"
cursor chat "@prompting-expert design parallel subagent workflow for [multi-phase-project]"
```

## Task & Prompt Management

### Task Tracking Format
```markdown
## [2024-01-15 14:30] - Feature Name
- **Status**: Pending/In Progress/Completed
- **Subagents**: @ui-designer, @nextjs-dev
- **Created**: 2024-01-15 14:30:00
- **Completed**: 2024-01-15 16:45:00
- **Acceptance Criteria**: 
  - [ ] Responsive design implemented
  - [ ] Tests passing with 80%+ coverage
  - [ ] Security review completed
```

### Prompt Logging
- **Standard entries**: Simple tasks with basic logging
- **Optimized entries**: Complex tasks with "(OPTIMIZED)" tag showing before/after optimization analysis

## Quality Standards

### Testing Pyramid
- **Static Analysis**: ESLint, TypeScript, Prettier
- **Unit Tests (25%)**: Pure functions, utilities
- **Integration Tests (60%)**: Components, API routes  
- **E2E Tests (15%)**: Critical user journeys

### Performance Targets
- Lighthouse Performance: 95+
- Core Web Vitals: All "Good" ratings
- Bundle size: <250KB initial load
- First Contentful Paint: <1.8s

### Security Requirements
- OWASP compliance for all user inputs
- Parameterized queries (Prisma)
- JWT token security with proper expiration
- Environment variable scoping
- CSRF protection on forms

### Internationalization (i18n) Requirements
- **Language Support**: Dutch (nl), French (fr), German (de), English (en)
- **Translation Keys**: All user-facing text must use next-intl translation keys
- **Text Expansion**: UI layouts must accommodate 30% text expansion for German
- **Cultural Adaptation**: Date formats, number formats, and cultural conventions per locale
- **Testing**: All features tested across all supported languages
- **Fallback Strategy**: Graceful fallback to English for missing translations
- **Dynamic Content**: Server-generated content must be locale-aware

## Configuration Files

### .cursorrules (Essential Context)
```markdown
SYSTEM_CONTEXT: |
Required startup files:
- docs/architecture.mermaid, docs/technical.md
- tasks/todo.md, logs/prompts.md  
- prisma/schema.prisma
- .claude/subagents/*.md
- messages/*.json (translation files)

DEVELOPMENT_APPROACH: |
0. USE @prompting-expert for complex multi-subagent tasks
1. LOG prompts in logs/prompts.md with timestamps
2. CREATE tasks in tasks/todo.md with subagent assignments
3. DESIGN with @ui-designer (including i18n compliance) before implementation
4. TEST with @test-architect (including multilingual edge cases) following design specs
5. IMPLEMENT with @nextjs-dev (with i18n integration) using design/test specs
6. REVIEW with @security-auditor + @performance-optimizer
7. VALIDATE with @code-reviewer for quality and i18n completeness

OPTIMIZATION_TRIGGERS: |
Use @prompting-expert when:
- 3+ subagents needed
- Multi-day workflows  
- Architectural changes
- New features
- Budget-sensitive tasks

Skip for: Single edits, explanations, debugging, familiar tasks
```

### package.json (Key Scripts)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## Quick Setup

```bash
# 1. Create Next.js project
npx create-next-app@latest gastvrij --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
pnpm add @prisma/client prisma zod @hookform/react-hook-form
pnpm add -D vitest @testing-library/react playwright @playwright/test

# 3. Initialize tools
npx prisma init
npx shadcn-ui@latest init

# 4. Create project structure
mkdir -p .claude/subagents docs tasks logs tests/{unit,integration,e2e}
```

## Getting Started

1. **Copy subagent definitions** from `.claude/subagents/` to your project
2. **Configure .cursorrules** with the essential context above  
3. **Start with a simple feature** using the daily workflow
4. **Scale complexity** by adding more subagents as needed

---

*This guide prioritizes practical application over comprehensive documentation. For detailed examples and advanced patterns, see individual subagent definitions.*