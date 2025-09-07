# UX-Optimized Cookie Consent Component

A comprehensive cookie consent interface designed following Kunevinn UX best practices specifically for the Belgian hospitality market.

## Key Features

### 🎯 User Experience Principles

- **Non-Intrusive Design**: Fixed bottom banner that doesn't block content
- **Equal Choice Treatment**: No dark patterns, both accept/reject buttons have equal visual weight
- **Progressive Disclosure**: Compact view by default, expandable for detailed settings
- **Mobile-First Responsive**: Optimized for touch interactions starting at 320px
- **Value-Focused Messaging**: Benefits-oriented copy instead of legal jargon
- **Minimal Decision Fatigue**: Reduced cognitive load with clear categorization

### ♿ Accessibility (WCAG 2.1 AA)

- Full keyboard navigation support
- Screen reader optimized with proper ARIA labels
- Focus management and tab trapping
- High contrast mode support
- Touch targets minimum 44px height
- Semantic HTML structure

### 🚀 Performance

- Async loading with configurable delay
- Minimal DOM impact
- CSS-in-JS optimized styles
- No layout shift when appearing
- Smooth 300ms animations

## Component Structure

```typescript
interface UXOptimizedCookieConsentProps {
  onConsentChange?: (consent: ConsentState & { timestamp: Date; version: string }) => void;
  onDismiss?: () => void;
  className?: string;
  autoShow?: boolean;
  showDelay?: number;
}

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}
```

## Usage

### Basic Integration

```tsx
import { UXOptimizedCookieConsent } from '@/components/UXOptimizedCookieConsent';

export function MyApp() {
  const handleConsentChange = (consent) => {
    console.log('User consent:', consent);
    
    // Initialize services based on consent
    if (consent.analytics) {
      // Initialize Google Analytics
    }
    if (consent.marketing) {
      // Initialize marketing pixels
    }
  };

  return (
    <div>
      {/* Your app content */}
      
      <UXOptimizedCookieConsent
        onConsentChange={handleConsentChange}
        autoShow={true}
        showDelay={2000}
      />
    </div>
  );
}
```

### Advanced Configuration

```tsx
<UXOptimizedCookieConsent
  onConsentChange={(consent) => {
    // Handle consent change
    updateAnalytics(consent.analytics);
    updateMarketing(consent.marketing);
  }}
  onDismiss={() => {
    // Handle banner dismissal
    trackEvent('cookie_banner_dismissed');
  }}
  autoShow={true}
  showDelay={3000}
  className="custom-banner-styles"
/>
```

## Design Specifications

### Layout Dimensions

- **Compact Height**: 
  - Mobile: Maximum 80px
  - Desktop: Maximum 60px
- **Expanded Height**: Maximum 384px (max-h-96)
- **Animation Duration**: 300ms
- **Border Radius**: 8px (top corners only)

### Colors (Tailwind Classes)

```css
/* Primary Actions */
.btn-accept { @apply bg-hospitality-600 hover:bg-hospitality-700 text-white; }
.btn-reject { @apply border-gray-300 text-gray-700 hover:bg-gray-50; }

/* States */
.category-enabled { @apply border-hospitality-200 bg-hospitality-50; }
.category-disabled { @apply border-gray-200 hover:border-gray-300; }

/* Toggle Switch */
.toggle-enabled { @apply bg-hospitality-600; }
.toggle-disabled { @apply bg-gray-200; }
```

### Typography

- **Title**: `text-sm font-medium text-gray-900`
- **Description**: `text-xs text-gray-600 leading-relaxed`
- **Benefits**: `text-xs font-medium text-hospitality-700`
- **Categories**: `text-sm font-medium text-gray-900`

## Cookie Categories

### 1. Essentieel (Necessary)
- **Icon**: Shield
- **Benefit**: "Veilige en stabiele ervaring"
- **Always Required**: Yes
- **Description**: "Zorgt ervoor dat de website goed werkt"

### 2. Verbetering (Analytics)
- **Icon**: BarChart3
- **Benefit**: "Betere gebruikerservaring voor u"
- **Required**: No
- **Description**: "Helpt ons de website te optimaliseren"

### 3. Personalisatie (Marketing)
- **Icon**: Target
- **Benefit**: "Inhoud afgestemd op uw interesses"
- **Required**: No
- **Description**: "Toont relevante content en aanbiedingen"

### 4. Gemak (Preferences)
- **Icon**: User
- **Benefit**: "Website werkt zoals u het wilt"
- **Required**: No
- **Description**: "Onthoudt uw voorkeuren en instellingen"

## Anti-Dark Patterns Implementation

### Equal Visual Treatment
- Accept and reject buttons have identical sizes
- No color psychology manipulation (green/red)
- Equal font weights and spacing
- Same hover and focus states

### Value-Focused Messaging
- Leads with benefits instead of requests
- "We maken uw ervaring beter" instead of "We need your consent"
- Category benefits clearly stated
- Jargon-free Dutch language

### Progressive Disclosure
- Compact view shows essential information only
- Detailed settings behind single click
- No overwhelming initial choices
- Clear visual hierarchy

## Accessibility Implementation

### Keyboard Navigation

```typescript
// Escape key handling
if (event.key === 'Escape') {
  if (isExpanded) {
    setIsExpanded(false);
  } else {
    handleDismiss();
  }
}
```

### ARIA Labels

```tsx
<div
  role="dialog"
  aria-modal={isExpanded}
  aria-labelledby="cookie-consent-title"
  aria-describedby="cookie-consent-description"
>
```

### Focus Management

```typescript
// Focus first interactive element when banner appears
useEffect(() => {
  if (isVisible) {
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);
  }
}, [isVisible]);
```

## Performance Optimizations

### Delayed Loading
```typescript
// Add delay to reduce interruption
await new Promise(resolve => setTimeout(resolve, showDelay));
```

### Consent Persistence
```typescript
// 24-month expiry with automatic cleanup
const expiresAt = new Date();
expiresAt.setMonth(expiresAt.getMonth() + 24);
```

### Animation Optimization
```css
.banner-enter {
  @apply transform transition-transform duration-300 ease-out;
  @apply translate-y-full;
}

.banner-enter-active {
  @apply translate-y-0;
}
```

## Mobile-First Responsive Design

### Breakpoint Strategy

```typescript
// Tailwind breakpoints
const breakpoints = {
  xs: '475px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
};
```

### Touch Optimization

- Minimum touch target: 44px height
- Adequate spacing between interactive elements
- Single-thumb operation friendly
- Swipe gestures for dismissal (future enhancement)

## Integration with Existing Systems

### Analytics Integration

```typescript
const handleConsentChange = (consent) => {
  if (consent.analytics) {
    // Google Analytics
    gtag('config', 'GA_MEASUREMENT_ID');
    
    // Adobe Analytics
    adobe.analytics.init();
  }
};
```

### Marketing Tools Integration

```typescript
if (consent.marketing) {
  // Facebook Pixel
  fbq('init', 'FB_PIXEL_ID');
  
  // Google Ads
  gtag('config', 'AW-CONVERSION_ID');
}
```

## Testing Strategy

### Unit Tests
- Component rendering states
- Consent state management
- Accessibility compliance
- Error handling

### Integration Tests
- Local storage operations
- Event handlers
- Animation behavior
- Responsive design

### UX Testing Metrics
- Time to decision
- Completion rate
- Abandonment rate
- User satisfaction scores

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- Mobile Safari 14+
- Chrome Mobile 88+

## GDPR Compliance

### Legal Requirements Met
- ✅ Clear and specific consent
- ✅ Granular consent options
- ✅ Easy withdrawal mechanism
- ✅ Consent versioning
- ✅ Expiry handling (24 months)
- ✅ Data minimization principle

### Documentation Requirements
- Privacy policy link
- Cookie policy link
- Clear purpose descriptions
- Legal basis statements
- Contact information

## Future Enhancements

### Planned Features
- A/B testing framework integration
- Advanced consent analytics
- Multi-language support
- Custom theming system
- Swipe gesture support

### Performance Improvements
- Web Workers for heavy operations
- Service Worker integration
- Lazy loading optimization
- Bundle size analysis

## Support & Maintenance

### Version History
- v1.0: Initial UX-optimized implementation
- Future versions will follow semantic versioning

### Contact
- Development Team: dev@gastvrij.eu
- Privacy Officer: privacy@gastvrij.eu
- UX Designer: ux@gastvrij.eu

---

**Note**: This component is specifically designed for the Belgian hospitality market and follows local GDPR implementations. Ensure legal review before production deployment.