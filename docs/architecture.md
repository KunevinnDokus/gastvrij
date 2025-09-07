# Gastvrij.eu Architecture Documentation

## System Overview

Gastvrij.eu is a Belgian hospitality SaaS platform built with Next.js 14, designed for GDPR compliance and mobile-first user experience.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Server Components + Client Components
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Validation**: Zod schemas

### Testing
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Mocking**: MSW (Mock Service Worker)

### Deployment
- **Platform**: Vercel
- **Database**: Neon PostgreSQL
- **CDN**: Vercel Edge Network

## Architecture Principles

### 1. Mobile-First Design
- Responsive design starting from mobile devices
- Touch-friendly interfaces
- Optimized for slow connections

### 2. GDPR Compliance
- Privacy by design
- Data minimization
- User consent management
- Right to be forgotten implementation

### 3. Performance First
- Server Components for data fetching
- Client Components only when necessary
- Image optimization
- Bundle size optimization

### 4. Security
- OWASP compliance
- Input validation and sanitization
- Secure authentication
- Data encryption

## Database Schema

### Core Entities
- **Users**: GDPR-compliant user management
- **Properties**: Hospitality property listings
- **Bookings**: Reservation management
- **Payments**: Payment processing
- **Reviews**: Guest feedback system

### GDPR Compliance Fields
- `gdprConsent`: User consent status
- `gdprConsentDate`: Consent timestamp
- `dataRetention`: Data deletion date
- `isActive`: Account status

## API Design

### RESTful Endpoints
- `/api/properties` - Property management
- `/api/bookings` - Booking operations
- `/api/auth` - Authentication
- `/api/gdpr` - Privacy compliance

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

## Security Measures

### Authentication
- NextAuth.js with JWT tokens
- Secure session management
- Multi-factor authentication support

### Data Protection
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection

### GDPR Compliance
- Cookie consent management
- Data retention policies
- User data export/deletion
- Privacy policy integration

## Performance Optimization

### Core Web Vitals Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### Optimization Strategies
- Server Components for data fetching
- Image optimization with Next.js Image
- Bundle splitting and lazy loading
- Database query optimization

## Mobile Optimization

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
- Fast loading on slow connections
- Offline capability (future)

## Belgian Market Features

### Localization
- Dutch (primary)
- French (secondary)
- English (international)

### Payment Methods
- Bancontact
- iDEAL
- Credit cards
- Bank transfers

### Compliance
- Belgian VAT handling
- GDPR compliance
- Local business regulations

## Development Workflow

### Design-First TDD
1. **Design**: UI/UX specifications
2. **Test**: Test cases and scenarios
3. **Build**: Implementation
4. **Optimize**: Performance and security
5. **Review**: Quality assurance

### Subagent Specialization
- **UI Designer**: Design systems and accessibility
- **Test Architect**: Comprehensive test strategies
- **Next.js Developer**: Implementation
- **Security Auditor**: OWASP compliance
- **Performance Optimizer**: Core Web Vitals
- **Code Reviewer**: Quality assurance

## Monitoring and Analytics

### Performance Monitoring
- Core Web Vitals tracking
- Bundle size monitoring
- Database query performance
- API response times

### GDPR-Compliant Analytics
- Privacy-first tracking
- User consent management
- Data anonymization
- Retention policy compliance

## Future Enhancements

### Planned Features
- Real-time chat
- Advanced analytics
- Multi-property management
- API for third-party integrations
- Mobile app (React Native)

### Scalability Considerations
- Database sharding
- CDN optimization
- Microservices architecture
- Container orchestration
