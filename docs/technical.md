# Gastvrij.eu Technical Documentation

## Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/gastvrij/gastvrij.eu.git
cd gastvrij.eu

# Install dependencies
pnpm install

# Setup environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development server
pnpm dev
```

## Environment Configuration

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gastvrij"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Belgian SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Payment Processing
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# GDPR Compliance
GDPR_DATA_RETENTION_DAYS=2555
GDPR_CONSENT_REQUIRED=true
```

## Database Schema

### Prisma Models

#### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // GDPR compliance
  gdprConsent     Boolean   @default(false)
  gdprConsentDate DateTime?
  dataRetention   DateTime?
  isActive        Boolean   @default(true)
  
  // Relations
  accounts Account[]
  sessions Session[]
  properties Property[]
  bookings Booking[]
  reviews Review[]
}
```

#### Property Model
```prisma
model Property {
  id          String   @id @default(cuid())
  name        String
  description String?
  address     String
  city        String
  postalCode  String
  country     String   @default("Belgium")
  
  propertyType PropertyType @default(APARTMENT)
  maxGuests    Int
  bedrooms     Int
  bathrooms    Int
  amenities    String[]
  
  basePrice    Decimal @db.Decimal(10, 2)
  currency     String  @default("EUR")
  
  isActive     Boolean @default(true)
  isVerified   Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  images      PropertyImage[]
  bookings    Booking[]
  reviews     Review[]
  availability PropertyAvailability[]
}
```

## API Endpoints

### Properties API
```typescript
// GET /api/properties
// Get all properties with pagination
interface PropertiesResponse {
  data: Property[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// POST /api/properties
// Create new property
interface CreatePropertyRequest {
  name: string
  description?: string
  address: string
  city: string
  postalCode: string
  propertyType: PropertyType
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  basePrice: number
}
```

### Bookings API
```typescript
// POST /api/bookings
// Create new booking
interface CreateBookingRequest {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  specialRequests?: string
}

// GET /api/bookings
// Get user bookings
interface BookingsResponse {
  data: Booking[]
  pagination: PaginationInfo
}
```

### GDPR API
```typescript
// GET /api/gdpr/consent
// Get user consent status
interface ConsentResponse {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
  timestamp: string
}

// POST /api/gdpr/consent
// Update user consent
interface UpdateConsentRequest {
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

// DELETE /api/gdpr/data
// Request data deletion
interface DataDeletionRequest {
  reason: string
  confirmation: boolean
}
```

## Component Architecture

### Server Components
Used for data fetching and static content:
```typescript
// app/properties/page.tsx
export default async function PropertiesPage() {
  const properties = await getProperties()
  
  return (
    <div>
      <PropertiesList properties={properties} />
    </div>
  )
}
```

### Client Components
Used for interactivity:
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function BookingForm({ propertyId }: { propertyId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (data: BookingFormData) => {
    setIsLoading(true)
    // Handle booking submission
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isLoading}>
        Reserveer Nu
      </Button>
    </form>
  )
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

### Integration Tests
```typescript
// tests/integration/api/properties.test.ts
import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/properties/route'

describe('/api/properties', () => {
  it('returns properties with pagination', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toBeInstanceOf(Array)
    expect(data.pagination).toBeDefined()
  })
})
```

### E2E Tests
```typescript
// tests/e2e/booking.spec.ts
import { test, expect } from '@playwright/test'

test('user can create booking', async ({ page }) => {
  await page.goto('/properties/1')
  await page.click('[data-testid="book-button"]')
  
  await page.fill('[name="checkIn"]', '2024-12-01')
  await page.fill('[name="checkOut"]', '2024-12-05')
  await page.fill('[name="guests"]', '2')
  
  await page.click('[type="submit"]')
  
  await expect(page).toHaveURL(/bookings/)
})
```

## GDPR Compliance Implementation

### Consent Management
```typescript
// lib/gdpr/consent.ts
export interface GDPRConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
  timestamp: Date
}

export function saveConsent(consent: GDPRConsent) {
  // Save to database with timestamp
  // Update user preferences
  // Log consent changes
}
```

### Data Retention
```typescript
// lib/gdpr/retention.ts
export function calculateRetentionDate(days: number = 2555): Date {
  const now = new Date()
  now.setDate(now.getDate() + days)
  return now
}

export function isRetentionExpired(retentionDate: Date): boolean {
  return new Date() > retentionDate
}
```

### Data Export
```typescript
// app/api/gdpr/export/route.ts
export async function GET(request: Request) {
  const user = await getCurrentUser()
  
  const userData = {
    profile: user,
    bookings: await getUserBookings(user.id),
    reviews: await getUserReviews(user.id),
    // ... other user data
  }
  
  return Response.json(userData)
}
```

## Performance Optimization

### Image Optimization
```typescript
import Image from 'next/image'

export function PropertyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

### Database Optimization
```typescript
// lib/db/properties.ts
export async function getPropertiesWithImages() {
  return prisma.property.findMany({
    include: {
      images: {
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  })
}
```

## Deployment

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

### Database Migrations
```bash
# Generate migration
pnpm db:migrate dev --name add_property_images

# Deploy to production
pnpm db:migrate deploy
```

## Monitoring and Analytics

### Performance Monitoring
```typescript
// lib/analytics/performance.ts
export function trackCoreWebVitals() {
  // Track LCP, FID, CLS
  // Send to analytics service
  // Alert on performance degradation
}
```

### Error Tracking
```typescript
// lib/error-tracking.ts
export function trackError(error: Error, context: any) {
  // Log error with context
  // Send to error tracking service
  // Alert on critical errors
}
```

## Security Best Practices

### Input Validation
```typescript
import { z } from 'zod'

const PropertySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().regex(/^[1-9][0-9]{3}$/),
  maxGuests: z.number().min(1).max(20),
  basePrice: z.number().min(0).max(10000)
})
```

### Authentication
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
}
```

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
pnpm db:studio

# Reset database
pnpm db:migrate reset
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### TypeScript Errors
```bash
# Check TypeScript
pnpm type-check

# Generate Prisma client
pnpm db:generate
```

## Contributing

### Development Workflow
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run tests and linting
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
