# Gastvrij.eu - Belgian Hospitality Platform

Een premium hospitality management platform voor de Belgische markt met volledige GDPR-compliance en mobile-first design.

## 🚀 Features

### 🇧🇪 Belgian Market Focus
- Nederlandse en Franse taalondersteuning
- Belgische betalingsmethoden (Bancontact, iDEAL)
- Lokale compliance en regelgeving
- Belgische valuta en belastingen

### 🔒 GDPR Compliance
- Privacy by design architectuur
- Cookie consent management
- Data retention policies
- Right to be forgotten implementatie
- Data portability export

### 📱 Mobile-First Design
- Responsive design vanaf mobiele apparaten
- Touch-friendly interfaces
- Geoptimaliseerd voor trage verbindingen
- Progressive Web App ready

### ⚡ Performance
- Next.js 14 met Server Components
- Core Web Vitals geoptimaliseerd
- Bundle size optimalisatie
- Image optimization

## 🛠️ Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + Playwright + RTL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel + Neon PostgreSQL

## 🏗️ Project Structure

```
gastvrij/
├── .claude/subagents/          # AI specialist definitions
├── docs/                       # Architecture & specs
├── tasks/                      # Task tracking
├── logs/                       # Prompt history
├── src/
│   ├── app/                   # Next.js App Router
│   ├── components/            # UI components
│   ├── lib/                   # Utilities & logic
│   └── types/                 # TypeScript definitions
├── tests/                     # Test organization
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # E2E tests
└── prisma/                    # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/gastvrij/gastvrij.eu.git
cd gastvrij.eu

# Install dependencies
npm install

# Setup environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:coverage # Run tests with coverage
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

### Design-First TDD Workflow
1. **Design**: UI/UX specifications met @ui-designer
2. **Test**: Test cases met @test-architect
3. **Build**: Implementatie met @nextjs-dev
4. **Optimize**: Performance met @performance-optimizer
5. **Review**: Security met @security-auditor
6. **Validate**: Quality met @code-reviewer

## 🗄️ Database Schema

### Core Models
- **Users**: GDPR-compliant user management
- **Properties**: Hospitality property listings
- **Bookings**: Reservation management
- **Payments**: Payment processing
- **Reviews**: Guest feedback system

### GDPR Compliance Fields
```prisma
model User {
  gdprConsent     Boolean   @default(false)
  gdprConsentDate DateTime?
  dataRetention   DateTime?
  isActive        Boolean   @default(true)
}
```

## 🔐 Security

### Authentication
- NextAuth.js met JWT tokens
- Secure session management
- Multi-factor authentication support

### Data Protection
- Input validation met Zod
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection

### GDPR Compliance
- Cookie consent management
- Data retention policies
- User data export/deletion
- Privacy policy integration

## 📊 Performance

### Core Web Vitals Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### Optimization Strategies
- Server Components voor data fetching
- Image optimization met Next.js Image
- Bundle splitting en lazy loading
- Database query optimization

## 🧪 Testing

### Test Pyramid
- **Unit Tests (25%)**: Pure functions, utilities
- **Integration Tests (60%)**: Components, API routes
- **E2E Tests (15%)**: Critical user journeys

### Test Commands
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report
```

## 🌐 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Setup environment variables in Vercel dashboard
```

### Database Setup
```bash
# Production migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## 📱 Mobile Optimization

### Responsive Breakpoints
- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Features
- Touch-friendly navigation
- Optimized form inputs
- Fast loading op trage verbindingen
- Offline capability (future)

## 🔒 GDPR Compliance

### Privacy Features
- Cookie consent management
- Data retention policies
- User consent tracking
- Data export/deletion
- Privacy policy integration

### Data Handling
- Privacy by design
- Data minimization
- User consent management
- Right to be forgotten
- Data portability

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run tests en linting
5. Create pull request
6. Code review
7. Merge to main

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- 80%+ test coverage
- Mobile-first responsive design
- GDPR compliance
- Accessibility (WCAG 2.1 AA)

## 📄 License

MIT License - zie [LICENSE](LICENSE) voor details.

## 📞 Support

- **Email**: support@gastvrij.eu
- **Documentation**: [docs.gastvrij.eu](https://docs.gastvrij.eu)
- **Issues**: [GitHub Issues](https://github.com/gastvrij/gastvrij.eu/issues)

---

Gemaakt met ❤️ voor de Belgische hospitality markt
