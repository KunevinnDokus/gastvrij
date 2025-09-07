# Cookie Consent Component Test Suite

This directory contains comprehensive tests for the CookieConsent component, ensuring GDPR compliance, security, accessibility, and robustness across various edge cases.

## Test Structure

### Unit Tests (`/unit/`)

#### Component Tests (`/unit/components/CookieConsent.test.tsx`)
Core functionality tests for the CookieConsent component:
- **Initial Render**: Component visibility logic based on existing consent
- **Checkbox Interactions**: All cookie category toggles (analytics, marketing, preferences)
- **Accept/Decline Functionality**: Button actions and callback handling
- **State Management**: Internal component state consistency
- **Error Handling**: Graceful handling of GDPR function failures

#### Security Tests (`/unit/security/cookie-consent-security.test.tsx`)
Security-focused tests ensuring safe operation:
- **localStorage Error Handling**: Private browsing mode, quota exceeded, unavailable storage
- **JSON Parsing Security**: Malformed JSON, invalid structures, prototype pollution prevention
- **XSS Prevention**: Safe content rendering, sanitized dynamic content
- **TypeScript Type Safety**: Proper type validation and constraint enforcement
- **Content Security Policy**: No inline styles/scripts, safe CSS classes
- **Session Security**: Secure localStorage key usage, no sensitive data exposure

#### Accessibility Tests (`/unit/accessibility/cookie-consent-a11y.test.tsx`)
Comprehensive accessibility compliance:
- **Keyboard Navigation**: Full tab order, Enter/Space activation, Shift+Tab reverse navigation
- **ARIA Labels and Roles**: Proper semantic markup, descriptive accessible names
- **Focus Management**: Visible focus indicators, appropriate initial focus, focus restoration
- **Screen Reader Compatibility**: Meaningful context, clear instructions, proper announcements
- **High Contrast Support**: Sufficient color contrast, semantic HTML elements
- **Landmark Regions**: Clear navigation boundaries, proper dialog/banner roles

#### Edge Cases (`/unit/edge-cases/cookie-consent-edge-cases.test.tsx`)
Comprehensive edge case coverage:
- **Existing Consent Scenarios**: Various consent states, missing/invalid timestamps
- **Banner Reappearance Logic**: Consent state changes, rapid updates
- **Multiple Consent Updates**: Concurrent operations, rapid user interactions
- **Network Failures**: localStorage failures, concurrent saves, retry mechanisms
- **Component Lifecycle**: Unmounting during operations, prop changes at runtime
- **Browser Environment**: SSR compatibility, different window sizes, navigation events
- **Performance**: Rapid re-renders, large numbers of updates

### Integration Tests (`/integration/`)

#### GDPR Compliance (`/integration/gdpr-compliance.test.tsx`)
End-to-end GDPR compliance verification:
- **Consent Persistence**: Cross-session storage, versioning, expiry handling
- **Granular Consent Tracking**: Individual category management
- **Consent Withdrawal**: Complete withdrawal mechanism
- **Database-UI Consistency**: Schema alignment, format compatibility
- **API Integration**: Successful saves, error handling, graceful degradation
- **Analytics Management**: Script enabling/disabling based on consent
- **GDPR Rights Compliance**: Clear information, policy access, data minimization
- **Timestamp Tracking**: Accurate consent timing, update tracking

### Mock Services (`/mocks/`)

#### Enhanced MSW Handlers (`/mocks/handlers.ts`)
Comprehensive API mocking for realistic testing:
- **Consent Management**: GET, POST, PUT, DELETE operations
- **Data Export**: GDPR data portability compliance
- **Account Deletion**: Right to be forgotten implementation
- **Consent History**: Audit trail functionality
- **Error Simulation**: Various failure scenarios (500, timeout, rate limiting)
- **Validation**: Server-side consent data validation
- **User Scenarios**: Different consent states for testing

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
# Unit tests only
npm test tests/unit

# Integration tests only
npm test tests/integration

# Security tests only
npm test tests/unit/security

# Accessibility tests only
npm test tests/unit/accessibility

# Edge cases only
npm test tests/unit/edge-cases
```

### Test Coverage
```bash
npm run test:coverage
```

### Interactive Test UI
```bash
npm run test:ui
```

## Test Scenarios Covered

### GDPR Compliance ✅
- [x] Consent persistence across sessions
- [x] Granular consent tracking (analytics, marketing, preferences)
- [x] Consent versioning and expiry
- [x] Consent withdrawal mechanism
- [x] Database-UI consistency validation
- [x] Data minimization principle compliance
- [x] Timestamp tracking for audit trails

### Security ✅
- [x] localStorage error handling (private browsing)
- [x] JSON parsing validation with malformed data
- [x] XSS prevention in consent UI
- [x] TypeScript type safety validation
- [x] Prototype pollution prevention
- [x] Content Security Policy compliance
- [x] Session security (no sensitive data exposure)

### Accessibility ✅
- [x] Keyboard navigation (Tab, Shift+Tab, Enter, Space)
- [x] ARIA labels and roles
- [x] Focus management and visual indicators
- [x] Screen reader compatibility
- [x] High contrast and visual accessibility
- [x] Semantic HTML structure
- [x] Proper heading hierarchy

### Integration ✅
- [x] Database schema matches UI consent options
- [x] Consent changes properly saved to database
- [x] Analytics/marketing scripts respond to consent changes
- [x] API error handling and graceful degradation
- [x] Cross-session persistence validation

### Edge Cases ✅
- [x] Component behavior with existing consent
- [x] Banner reappearance logic
- [x] Multiple consent updates
- [x] Network failures during consent save
- [x] Component unmounting during operations
- [x] Browser environment variations (SSR, different sizes)
- [x] Performance under stress conditions

## Key Test Patterns

### Mocking Strategy
- **GDPR Functions**: Mocked for unit tests, real implementations for integration tests
- **localStorage**: Custom mocks to simulate various failure scenarios
- **API Calls**: MSW for realistic network interaction simulation
- **Console Methods**: Mocked to suppress expected error logs during testing

### Async Testing
- Uses `@testing-library/user-event` for realistic user interactions
- Proper `waitFor` usage for async state changes
- Promise-based testing for network operations

### Error Scenario Testing
- Graceful degradation validation
- No crashes on expected errors
- User experience maintained despite failures

### Accessibility Testing
- Keyboard-only navigation verification
- Screen reader simulation
- ARIA attribute validation
- Focus management testing

## Continuous Integration

These tests are designed to:
1. **Validate GDPR Compliance** - Ensure legal requirements are met
2. **Prevent Security Vulnerabilities** - Guard against common web security issues
3. **Maintain Accessibility Standards** - Ensure inclusive user experience
4. **Handle Edge Cases Gracefully** - Provide robust user experience
5. **Enable Confident Refactoring** - Allow safe code changes with test coverage

## Test Data Scenarios

The test suite includes various user scenarios:
- `user-no-consent`: User with no existing consent
- `user-full-consent`: User with all cookie categories accepted
- `user-with-active-bookings`: User that cannot delete account due to active bookings

## Contributing to Tests

When adding new features or modifying the CookieConsent component:

1. **Add unit tests** for new functionality
2. **Update integration tests** if database schema changes
3. **Add security tests** for any new data handling
4. **Update accessibility tests** for UI changes
5. **Consider edge cases** for the new functionality
6. **Update MSW handlers** if new API endpoints are added

## Test Quality Metrics

The test suite aims for:
- **95%+ Code Coverage** - Comprehensive function and branch coverage
- **Zero Flaky Tests** - Reliable and deterministic test execution
- **Fast Execution** - Complete suite runs in under 30 seconds
- **Clear Error Messages** - Descriptive failures for easy debugging
- **Realistic Scenarios** - Tests reflect real-world usage patterns

This comprehensive test suite ensures the CookieConsent component is GDPR-compliant, secure, accessible, and robust across all usage scenarios.