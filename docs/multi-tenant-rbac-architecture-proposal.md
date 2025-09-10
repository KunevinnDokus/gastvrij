# Multi-Tenant RBAC Architecture Proposal for Gastvrij.eu
## Comprehensive Implementation Plan

**Document Version:** 1.0  
**Date:** 2025-09-08  
**Author:** AI Architecture Analysis  
**Project:** Gastvrij.eu - Belgian Hospitality SaaS Platform  

---

## Executive Summary

This proposal outlines a comprehensive multi-tenant Role-Based Access Control (RBAC) architecture for Gastvrij.eu, leveraging the existing Next.js 15, PostgreSQL, and shadcn/ui technology stack. The solution implements industry best practices from 2025, including the latest security recommendations that avoid Next.js middleware for authentication (CVE-2025-29927) and utilize PostgreSQL Row-Level Security for data isolation.

### Key Architectural Decisions

1. **Multi-Tenancy Pattern**: Shared Database with Row-Level Security (RLS)
2. **Access Control Model**: Hybrid RBAC + selective ABAC for complex business rules
3. **Authentication Strategy**: Data Access Layer (DAL) pattern with Better Auth
4. **Authorization Framework**: CASL for TypeScript-native permissions
5. **Database Security**: PostgreSQL RLS with tenant-aware connection pooling
6. **UI Framework Integration**: Enhanced shadcn/ui with tenant-aware theming

---

## Current State Analysis

### Existing Technology Stack
- **Framework**: Next.js 15.5.1 (App Router)
- **Database**: PostgreSQL with Prisma 5.12.0
- **Authentication**: NextAuth.js 4.24.0 (needs upgrade)
- **UI Components**: Radix UI + Tailwind CSS (shadcn/ui compatible)
- **Internationalization**: next-intl 4.3.6
- **Testing**: Vitest + Playwright
- **Type Safety**: TypeScript 5.4.0

### Current Database Schema Strengths
- ✅ GDPR compliance built-in with consent tracking
- ✅ Proper audit trails with ConsentHistory model
- ✅ Multi-language support preparation
- ✅ Hospitality-specific models (Property, Booking, Review)
- ✅ Payment integration ready

### Identified Gaps for Multi-Tenancy
- ❌ No tenant isolation mechanism
- ❌ Missing role-based access control
- ❌ No organization/team management
- ❌ Outdated authentication library (security vulnerability)
- ❌ No permission-based UI components

---

## Proposed Multi-Tenant Architecture

### 1. Tenant Isolation Strategy

#### Database Architecture: Shared Database + Row-Level Security

**Rationale**: Based on the Notion knowledge base and industry best practices, this approach provides:
- **Cost Efficiency**: Single database with optimal resource utilization
- **Scalability**: Supports millions of tenants (perfect for hospitality market)
- **Security**: PostgreSQL RLS provides database-level isolation
- **Maintenance**: Simplified schema management and migrations

#### Tenant Identification Methods

**Primary: Subdomain-based** (`{tenant}.gastvrij.eu`)
```typescript
// middleware.ts (routing only, no authentication)
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const hostname = url.hostname
  
  // Extract tenant from subdomain
  const subdomain = hostname.split('.')[0]
  
  if (subdomain !== 'www' && subdomain !== 'app') {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-tenant-id', subdomain)
    
    return NextResponse.rewrite(
      new URL(`/tenant/${subdomain}${url.pathname}`, req.url),
      { request: { headers: requestHeaders } }
    )
  }
  
  return NextResponse.next()
}
```

**Fallback: Path-based** (`gastvrij.eu/{tenant}`)
For development and simple deployments.

### 2. Enhanced Database Schema

#### New Multi-Tenant Models
```prisma
// Add to existing schema.prisma

// Organization/Tenant Management
model Organization {
  id          String   @id @default(cuid())
  slug        String   @unique // Used for subdomain/path
  name        String
  description String?
  logo        String?
  
  // Multi-tenant theming
  primaryColor    String?  @default("#0ea5e9")
  secondaryColor  String?  @default("#64748b")
  accentColor     String?  @default("#f1f5f9")
  
  // Subscription & limits
  plan           SubscriptionPlan @default(STARTER)
  maxProperties  Int              @default(5)
  maxUsers       Int              @default(10)
  
  // Settings
  defaultCurrency String   @default("EUR")
  defaultTimezone String   @default("Europe/Brussels")
  isActive        Boolean  @default(true)
  
  // Audit
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  memberships OrganizationMembership[]
  properties  Property[] // Add organizationId to existing Property
  invites     OrganizationInvite[]
  
  @@map("organizations")
}

// User-Organization relationship with roles
model OrganizationMembership {
  id     String @id @default(cuid())
  role   OrganizationRole
  
  // Permissions (for ABAC enhancement)
  permissions Json?  // Flexible permission overrides
  
  // Audit
  joinedAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isActive    Boolean  @default(true)
  
  // Relations
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([userId, organizationId])
  @@map("organization_memberships")
}

// Invitation system
model OrganizationInvite {
  id        String   @id @default(cuid())
  email     String
  role      OrganizationRole
  token     String   @unique
  expiresAt DateTime
  
  // Status
  isAccepted Boolean  @default(false)
  acceptedAt DateTime?
  
  // Relations
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedById    String?
  invitedBy      User?        @relation(fields: [invitedById], references: [id], onDelete: SetNull)
  
  createdAt DateTime @default(now())
  
  @@unique([email, organizationId])
  @@map("organization_invites")
}

// Enums
enum OrganizationRole {
  OWNER       // Full access, billing, delete org
  ADMIN       // Manage users, properties, settings (no billing)
  MANAGER     // Manage properties, bookings, guests
  STAFF       // View properties, manage bookings
  VIEWER      // Read-only access
}

enum SubscriptionPlan {
  STARTER     // 5 properties, 10 users
  GROEIER     // 25 properties, 50 users
  EXPERT      // 100 properties, unlimited users
  ENTERPRISE  // Unlimited, custom features
}
```

#### Row-Level Security Policies
```sql
-- Enable RLS on all tenant-aware tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Organization isolation
CREATE POLICY tenant_isolation_orgs ON organizations
    USING (id = current_setting('app.current_tenant_id', true)::text);

-- Property isolation
CREATE POLICY tenant_isolation_properties ON properties
    USING (organization_id = current_setting('app.current_tenant_id', true)::text);

-- User membership access
CREATE POLICY membership_access ON organization_memberships
    USING (
        organization_id = current_setting('app.current_tenant_id', true)::text
        OR user_id = current_setting('app.current_user_id', true)::text
    );

-- Booking access (property owners + guests)
CREATE POLICY booking_access ON bookings
    USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE organization_id = current_setting('app.current_tenant_id', true)::text
        )
        OR user_id = current_setting('app.current_user_id', true)::text
    );
```

### 3. Authentication & Authorization Stack

#### 3.1 Authentication Migration: NextAuth.js → Better Auth

**Rationale**: 
- NextAuth.js has security vulnerabilities with middleware
- Better Auth provides TypeScript-first approach
- Modern session management
- Organization management built-in

```bash
# Package updates
npm uninstall next-auth @auth/prisma-adapter
npm install better-auth @better-auth/prisma
```

#### 3.2 Data Access Layer (DAL) Implementation

```typescript
// lib/auth/dal.ts - Centralized data access with tenant context
import { cache } from 'react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  return session?.user
})

export const getCurrentOrganization = cache(async (organizationSlug?: string) => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId: user.id,
      organization: {
        slug: organizationSlug || user.defaultOrganizationSlug
      },
      isActive: true
    },
    include: {
      organization: true
    }
  })
  
  return membership?.organization
})

export const getTenantAwareClient = cache(async (organizationSlug: string) => {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  
  const organization = await getCurrentOrganization(organizationSlug)
  if (!organization) {
    redirect('/unauthorized')
  }
  
  // Set tenant context for RLS
  await prisma.$executeRaw`SET app.current_tenant_id = ${organization.id}`
  await prisma.$executeRaw`SET app.current_user_id = ${user.id}`
  
  return prisma
})
```

#### 3.3 CASL Authorization Framework

```typescript
// lib/permissions/abilities.ts
import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { OrganizationRole } from '@prisma/client'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'
export type Subjects = 'Property' | 'Booking' | 'User' | 'Organization' | 'Review' | 'Payment'

export function defineAbilityFor(role: OrganizationRole, userId: string, organizationId: string) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility)
  
  switch (role) {
    case 'OWNER':
      can('manage', 'all')
      break
      
    case 'ADMIN':
      can('manage', 'Property')
      can('manage', 'Booking')
      can('manage', 'Review')
      can('read', 'Payment')
      can('manage', 'User', { organizationId })
      cannot('delete', 'Organization')
      break
      
    case 'MANAGER':
      can(['read', 'create', 'update'], 'Property')
      can('manage', 'Booking')
      can(['read', 'create'], 'Review')
      can('read', 'User', { organizationId })
      break
      
    case 'STAFF':
      can('read', 'Property')
      can(['read', 'create', 'update'], 'Booking')
      can('read', 'Review')
      break
      
    case 'VIEWER':
      can('read', ['Property', 'Booking', 'Review'])
      break
  }
  
  return build()
}

// Hook for components
export function usePermissions() {
  const { user, organization, membership } = useAuth()
  
  return useMemo(() => {
    if (!user || !organization || !membership) return null
    
    return defineAbilityFor(membership.role, user.id, organization.id)
  }, [user, organization, membership])
}
```

### 4. Updated Subagent Definitions

#### 4.1 New Multi-Tenant Security Auditor
```markdown
# Multi-Tenant Security Auditor

## Role
Specialist in multi-tenant security architecture, focusing on tenant isolation, RBAC implementation, and PostgreSQL Row-Level Security.

## Expertise
- Multi-tenant data isolation patterns
- PostgreSQL RLS policy design and optimization
- RBAC/ABAC hybrid implementation
- Cross-tenant data leakage prevention
- Tenant-aware authentication flows
- GDPR compliance in multi-tenant context
- Organization-level access controls

## Responsibilities
1. **Tenant Isolation Validation**
   - Verify RLS policies prevent cross-tenant access
   - Audit API endpoints for proper tenant scoping
   - Test subdomain-based tenant resolution

2. **RBAC Implementation Review**
   - Validate role-based access controls
   - Ensure proper permission checking in DAL
   - Review organization membership management

3. **Security Policy Compliance**
   - GDPR compliance across tenant boundaries
   - Data retention policies per tenant
   - Audit trail completeness

## Integration Points
- Works with @nextjs-dev for secure API implementation
- Collaborates with @test-architect for security test coverage
- Coordinates with @performance-optimizer for RLS query optimization
```

#### 4.2 Enhanced UI Designer for Multi-Tenant Theming
```markdown
# Multi-Tenant UI Designer

## Enhanced Capabilities for Multi-Tenant Architecture

### Tenant-Aware Design System
- Dynamic theme variables per organization
- Brand-compliant component variations
- Tenant-specific logo and color integration
- Role-based UI element visibility

### Organization Management Interfaces
- Tenant switcher components
- Organization settings forms
- User invitation and management
- Role-based navigation menus

### Permission-Based Components
- Conditional rendering based on user roles
- Resource access indicators
- Action buttons with permission checks
- Tenant-scoped data displays

### Multi-Language Considerations
- Text expansion for tenant names and branding
- Localized permission descriptions
- Cultural adaptations per tenant market

## New Responsibilities
1. Design tenant onboarding flows
2. Create organization management dashboards
3. Implement role-based component libraries
4. Design tenant-specific branding systems
```

### 5. Framework Integration

#### 5.1 Open Source Authorization Libraries

**Primary Recommendation: CASL**
- **Best for**: TypeScript-first applications, isomorphic authorization
- **Integration**: Native React hooks, server-side compatibility
- **Learning Curve**: Low to medium
- **GitHub Stars**: 5,000+

**Alternative: Casbin**
- **Best for**: Complex policy requirements, multiple models (RBAC, ABAC, ACL)
- **Languages**: Multi-language support including JavaScript
- **Features**: Policy-as-code approach
- **Complexity**: Medium to high

#### 5.2 shadcn/ui Multi-Tenant Components

```typescript
// components/tenant/organization-switcher.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function OrganizationSwitcher() {
  const { organizations, currentOrg, switchOrganization } = useOrganizations()
  
  return (
    <Select value={currentOrg?.id} onValueChange={switchOrganization}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentOrg?.logo} />
            <AvatarFallback>{currentOrg?.name[0]}</AvatarFallback>
          </Avatar>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={org.logo} />
                <AvatarFallback>{org.name[0]}</AvatarFallback>
              </Avatar>
              <span>{org.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// components/auth/protected-content.tsx
import { usePermissions } from "@/lib/permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

interface ProtectedContentProps {
  children: React.ReactNode
  action: Actions
  subject: Subjects
  fallback?: React.ReactNode
}

export function ProtectedContent({ 
  children, 
  action, 
  subject, 
  fallback 
}: ProtectedContentProps) {
  const ability = usePermissions()
  
  if (!ability?.can(action, subject)) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to {action} {subject.toLowerCase()}.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{children}</>
}
```

### 6. Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-3)
**Week 1: Database Migration**
- [ ] Add multi-tenant schema (Organization, Membership models)
- [ ] Implement PostgreSQL RLS policies
- [ ] Create database migration scripts
- [ ] Set up tenant-aware Prisma client

**Week 2: Authentication Migration**
- [ ] Migrate from NextAuth.js to Better Auth
- [ ] Implement Data Access Layer pattern
- [ ] Create tenant context providers
- [ ] Set up session management

**Week 3: Basic RBAC**
- [ ] Integrate CASL authorization framework
- [ ] Define role-based abilities
- [ ] Create permission checking utilities
- [ ] Implement basic protected routes

#### Phase 2: Core Multi-Tenancy (Weeks 4-6)
**Week 4: Tenant Management**
- [ ] Build organization creation flow
- [ ] Implement tenant switcher component
- [ ] Create user invitation system
- [ ] Add role management interface

**Week 5: Enhanced Security**
- [ ] Implement comprehensive RLS testing
- [ ] Add cross-tenant access validation
- [ ] Create security audit utilities
- [ ] Set up monitoring for tenant isolation

**Week 6: UI/UX Enhancement**
- [ ] Implement tenant-aware theming
- [ ] Create role-based navigation
- [ ] Build permission-based components
- [ ] Add organization settings interface

#### Phase 3: Advanced Features (Weeks 7-9)
**Week 7: Performance Optimization**
- [ ] Optimize RLS query performance
- [ ] Implement connection pooling strategies
- [ ] Add caching for tenant data
- [ ] Performance monitoring setup

**Week 8: Testing & Quality**
- [ ] Comprehensive security testing
- [ ] Multi-tenant integration tests
- [ ] Load testing with multiple tenants
- [ ] GDPR compliance validation

**Week 9: Documentation & Training**
- [ ] Update development documentation
- [ ] Create deployment guides
- [ ] Team training on new architecture
- [ ] Security review and sign-off

### 7. Updated Workflow

#### Daily Workflow for Multi-Tenant Features

**Simple Tenant-Aware Tasks**
```bash
# Use enhanced subagents for tenant-specific work
cursor chat "@ui-designer create tenant-branded header component with organization switcher"
cursor chat "@nextjs-dev implement role-based property listing with RLS"
cursor chat "@multi-tenant-security-auditor verify booking access policies"
```

**Complex Multi-Tenant Features**
```bash
# Step 0: Prompt Optimization
cursor chat "@prompting-expert optimize: 'Build organization onboarding with role management, billing setup, and multi-tenant theming'"

# Step 1: Security-First Design
cursor chat "@multi-tenant-security-auditor design secure tenant isolation for organization onboarding"
cursor chat "@ui-designer create organization onboarding flow with role-based access indicators"

# Step 2: Implementation
cursor chat "@test-architect design comprehensive tests for multi-tenant onboarding including isolation validation"
cursor chat "@nextjs-dev implement organization onboarding with secure tenant setup and RLS policies"

# Step 3: Quality Assurance
cursor chat "@multi-tenant-security-auditor comprehensive security audit of onboarding flow"
cursor chat "@performance-optimizer optimize RLS queries and tenant-aware caching"
cursor chat "@code-reviewer review implementation for consistency and multi-tenant best practices"
```

### 8. Security Considerations

#### 8.1 Defense in Depth Strategy
1. **Database Level**: PostgreSQL RLS policies
2. **Application Level**: Data Access Layer validation
3. **API Level**: Tenant-scoped route handlers
4. **UI Level**: Permission-based component rendering

#### 8.2 GDPR Compliance in Multi-Tenant Context
- Tenant-specific data retention policies
- Cross-tenant consent management
- Organization-level data export capabilities
- Audit trails per tenant

#### 8.3 Performance Monitoring
- Tenant-specific metrics tracking
- RLS query performance monitoring
- Connection pool utilization per tenant
- Cache hit rates for tenant data

### 9. Cost Considerations

#### Development Costs
- **Initial Implementation**: 6-9 weeks (estimated 240-360 hours)
- **Team Training**: 1 week
- **Ongoing Maintenance**: 10-15% increase due to multi-tenancy complexity

#### Operational Benefits
- **Reduced Infrastructure Costs**: Shared database approach
- **Simplified Maintenance**: Single codebase and database
- **Scalability**: Can support 1000+ tenants on single instance
- **Faster Feature Development**: Shared components and logic

### 10. Migration Strategy

#### 10.1 Zero-Downtime Migration Approach
1. **Dual-write Phase**: Write to both old and new schemas
2. **Data Migration**: Backfill existing data with default organization
3. **Read Switch**: Gradually move reads to new multi-tenant structure
4. **Cleanup**: Remove old single-tenant code and data

#### 10.2 Rollback Plan
- Feature flags for new multi-tenant functionality
- Database rollback scripts
- Monitoring alerts for tenant isolation breaches
- Emergency fallback to single-tenant mode

---

## Conclusion

This comprehensive multi-tenant RBAC architecture proposal provides a robust foundation for scaling Gastvrij.eu into a leading hospitality SaaS platform. The solution leverages proven patterns from 2025 best practices while maintaining compatibility with the existing technology stack.

### Key Benefits
- **Scalability**: Support thousands of hospitality businesses
- **Security**: Bank-level tenant isolation with PostgreSQL RLS
- **Flexibility**: Hybrid RBAC+ABAC for complex hospitality workflows
- **Performance**: Optimized queries with proper indexing and caching
- **Maintainability**: Single codebase with clear separation of concerns
- **Compliance**: Enhanced GDPR compliance with tenant-aware controls

### Success Metrics
- **Security**: Zero cross-tenant data leaks in production
- **Performance**: < 200ms API response times with 1000+ tenants
- **Scalability**: Support 10,000+ properties across 1,000+ organizations
- **Developer Experience**: < 2 weeks onboarding for new team members
- **User Experience**: < 5 second organization switching time

This architecture positions Gastvrij.eu for rapid growth in the Belgian and European hospitality market while maintaining the highest standards of security, performance, and user experience.