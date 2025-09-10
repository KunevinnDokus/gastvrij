/**
 * Cookie Consent Analytics Integration for A/B Testing & UX Optimization
 * 
 * Features:
 * - A/B testing framework for consent UI variations
 * - UX metrics collection and analysis
 * - Performance monitoring and optimization
 * - Conversion funnel tracking
 * - Real-time consent analytics dashboard data
 * - Consent fatigue analysis and prevention
 * - Geographic and demographic consent patterns
 * 
 * @version 1.0
 * @author Gastvrij.eu Development Team - UI Designer
 */

// Analytics event types for cookie consent
export interface ConsentAnalyticsEvent {
  eventType: 'banner_shown' | 'interaction' | 'decision_made' | 'performance' | 'error';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  variant: string;
  data: Record<string, any>;
}

export interface ConsentUXMetrics {
  // Timing metrics
  timeToDecision: number; // milliseconds
  timeOnExpanded: number; // milliseconds spent in expanded view
  loadTime: number; // component load time
  
  // Interaction metrics
  interactionType: 'accept' | 'reject' | 'customize' | 'dismiss';
  expandedView: boolean;
  toggleCount: number; // how many times user toggled categories
  
  // UX quality metrics
  fatigueLevel: number; // 0-10 scale
  showCount: number; // how many times banner was shown
  conversionRate: number; // percentage of shows that lead to decision
  
  // Technical metrics
  memoryUsage: number; // MB
  renderTime: number; // milliseconds
  errorCount: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: {
    showDelay: number;
    bannerHeight: number;
    messaging: 'value-focused' | 'legal-focused' | 'minimal';
    buttonStyle: 'equal' | 'accept-primary' | 'minimal';
    progressiveDisclosure: boolean;
    colorScheme: 'hospitality' | 'neutral' | 'brand';
  };
  trafficPercent: number; // 0-100
  isActive: boolean;
}

export interface ConsentFunnelData {
  step: 'banner_shown' | 'expanded' | 'category_changed' | 'decision_made';
  timestamp: Date;
  variant: string;
  sessionId: string;
  previousStep?: string;
  dropoffReason?: string;
}

// Default A/B test variants for UX optimization
export const DEFAULT_AB_VARIANTS: ABTestVariant[] = [
  {
    id: 'control',
    name: 'Control - Current UX',
    description: 'Current UX-optimized bottom banner with hospitality branding',
    config: {
      showDelay: 2000,
      bannerHeight: 60,
      messaging: 'value-focused',
      buttonStyle: 'equal',
      progressiveDisclosure: true,
      colorScheme: 'hospitality',
    },
    trafficPercent: 40,
    isActive: true,
  },
  {
    id: 'minimal',
    name: 'Minimal UX',
    description: 'Ultra-minimal banner with reduced cognitive load',
    config: {
      showDelay: 3000,
      bannerHeight: 45,
      messaging: 'minimal',
      buttonStyle: 'minimal',
      progressiveDisclosure: true,
      colorScheme: 'neutral',
    },
    trafficPercent: 30,
    isActive: true,
  },
  {
    id: 'enhanced',
    name: 'Enhanced UX',
    description: 'Feature-rich banner with detailed value propositions',
    config: {
      showDelay: 1500,
      bannerHeight: 80,
      messaging: 'value-focused',
      buttonStyle: 'accept-primary',
      progressiveDisclosure: false,
      colorScheme: 'brand',
    },
    trafficPercent: 30,
    isActive: true,
  },
];

class CookieConsentAnalytics {
  private sessionId: string;
  private userId?: string;
  private currentVariant: ABTestVariant;
  private events: ConsentAnalyticsEvent[] = [];
  private funnelData: ConsentFunnelData[] = [];
  private startTime: number;
  private isAnalyticsEnabled: boolean = false;
  
  constructor(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.userId = userId;
    this.currentVariant = this.selectVariant();
    this.startTime = performance.now();
    
    // Only enable analytics if consent given (or during testing)
    this.checkAnalyticsConsent();
  }
  
  // A/B Testing - Variant Selection
  private selectVariant(): ABTestVariant {
    const activeVariants = DEFAULT_AB_VARIANTS.filter(v => v.isActive);
    const totalTraffic = activeVariants.reduce((sum, v) => sum + v.trafficPercent, 0);
    
    if (totalTraffic === 0 || activeVariants.length === 0) {
      // Fallback to first available variant - DEFAULT_AB_VARIANTS is guaranteed to have at least one item
      return DEFAULT_AB_VARIANTS[0]!;
    }
    
    const random = Math.random() * totalTraffic;
    let cumulative = 0;
    
    for (const variant of activeVariants) {
      cumulative += variant.trafficPercent;
      if (random <= cumulative) {
        console.log(`🧪 A/B Test - Selected variant: ${variant.name}`);
        return variant;
      }
    }
    
    return activeVariants[0]!;
  }
  
  // Get current A/B test variant
  public getCurrentVariant(): ABTestVariant {
    return this.currentVariant;
  }
  
  // Track banner shown event
  public trackBannerShown(context: {
    userAgent: string;
    viewport: { width: number; height: number };
    referrer: string;
    pageUrl: string;
  }): void {
    this.trackEvent('banner_shown', {
      variant: this.currentVariant.id,
      context,
      config: this.currentVariant.config,
    });
    
    this.trackFunnelStep('banner_shown');
  }
  
  // Track user interactions
  public trackInteraction(interaction: {
    type: 'expand' | 'collapse' | 'toggle_category' | 'button_hover';
    target: string;
    value?: any;
    timeFromShow: number;
  }): void {
    this.trackEvent('interaction', {
      interaction,
      variant: this.currentVariant.id,
    });
    
    if (interaction.type === 'expand') {
      this.trackFunnelStep('expanded');
    }
    
    if (interaction.type === 'toggle_category') {
      this.trackFunnelStep('category_changed');
    }
  }
  
  // Track decision made (accept/reject/customize)
  public trackDecision(decision: {
    type: 'accept' | 'reject' | 'customize';
    consent: {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
      preferences: boolean;
    };
    timeToDecision: number;
    expandedView: boolean;
    toggleCount: number;
  }): void {
    const metrics: ConsentUXMetrics = {
      timeToDecision: decision.timeToDecision,
      timeOnExpanded: 0, // TODO: track this
      loadTime: performance.now() - this.startTime,
      interactionType: decision.type,
      expandedView: decision.expandedView,
      toggleCount: decision.toggleCount,
      fatigueLevel: this.calculateFatigueLevel(),
      showCount: this.getShowCount(),
      conversionRate: this.calculateConversionRate(),
      memoryUsage: this.getMemoryUsage(),
      renderTime: 0, // TODO: track this
      errorCount: 0, // TODO: track this
    };
    
    this.trackEvent('decision_made', {
      decision,
      metrics,
      variant: this.currentVariant.id,
      acceptedCategories: Object.values(decision.consent).filter(Boolean).length,
    });
    
    this.trackFunnelStep('decision_made');
    
    // Send data to analytics if consent given
    if (decision.consent.analytics) {
      this.sendToAnalytics();
    }
  }
  
  // Track performance metrics
  public trackPerformance(metrics: {
    loadTime: number;
    memoryUsage: number;
    renderTime: number;
    errorCount: number;
  }): void {
    this.trackEvent('performance', {
      metrics,
      variant: this.currentVariant.id,
      timestamp: new Date(),
    });
  }
  
  // Track errors for debugging
  public trackError(error: {
    message: string;
    stack?: string;
    context: string;
  }): void {
    this.trackEvent('error', {
      error,
      variant: this.currentVariant.id,
      userAgent: navigator.userAgent,
    });
  }
  
  // Get conversion funnel analysis
  public getFunnelAnalysis(): {
    totalShows: number;
    expansions: number;
    categoryChanges: number;
    decisions: number;
    conversionRate: number;
    dropoffPoints: { step: string; count: number; rate: number }[];
  } {
    const steps = ['banner_shown', 'expanded', 'category_changed', 'decision_made'];
    const counts = steps.map(step => 
      this.funnelData.filter(f => f.step === step).length
    );
    
    const totalShows = counts[0] || 1;
    const decisions = counts[3] || 0;
    
    return {
      totalShows,
      expansions: counts[1] || 0,
      categoryChanges: counts[2] || 0,
      decisions,
      conversionRate: (decisions / totalShows) * 100,
      dropoffPoints: steps.map((step, index) => ({
        step,
        count: counts[index] || 0,
        rate: totalShows > 0 ? ((counts[index] || 0) / totalShows) * 100 : 0,
      })),
    };
  }
  
  // Get UX optimization insights
  public getUXInsights(): {
    optimalShowDelay: number;
    fatigueRisk: 'low' | 'medium' | 'high';
    preferredInteractionPattern: string;
    performanceScore: number;
    recommendations: string[];
  } {
    const metrics = this.calculateAggregateMetrics();
    const fatigueLevel = this.calculateFatigueLevel();
    
    return {
      optimalShowDelay: this.calculateOptimalDelay(),
      fatigueRisk: fatigueLevel < 3 ? 'low' : fatigueLevel < 7 ? 'medium' : 'high',
      preferredInteractionPattern: this.determinePreferredPattern(),
      performanceScore: this.calculatePerformanceScore(metrics),
      recommendations: this.generateRecommendations(metrics, fatigueLevel),
    };
  }
  
  // Export analytics data for external systems
  public exportData(): {
    sessionId: string;
    userId?: string;
    variant: ABTestVariant;
    events: ConsentAnalyticsEvent[];
    funnelData: ConsentFunnelData[];
    insights: any;
    summary: {
      totalEvents: number;
      sessionDuration: number;
      finalDecision?: string;
      performanceMetrics: any;
    };
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      variant: this.currentVariant,
      events: this.events,
      funnelData: this.funnelData,
      insights: this.getUXInsights(),
      summary: {
        totalEvents: this.events.length,
        sessionDuration: performance.now() - this.startTime,
        finalDecision: this.getFinalDecision(),
        performanceMetrics: this.calculateAggregateMetrics(),
      },
    };
  }
  
  // Private helper methods
  private trackEvent(eventType: ConsentAnalyticsEvent['eventType'], data: Record<string, any>): void {
    const event: ConsentAnalyticsEvent = {
      eventType,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId,
      variant: this.currentVariant.id,
      data,
    };
    
    this.events.push(event);
    
    // Real-time logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Cookie Consent Analytics:', event);
    }
  }
  
  private trackFunnelStep(step: ConsentFunnelData['step'], dropoffReason?: string): void {
    const funnelEvent: ConsentFunnelData = {
      step,
      timestamp: new Date(),
      variant: this.currentVariant.id,
      sessionId: this.sessionId,
      dropoffReason,
    };
    
    this.funnelData.push(funnelEvent);
  }
  
  private generateSessionId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private checkAnalyticsConsent(): void {
    // Check if analytics consent has been given
    try {
      const stored = localStorage.getItem('gastvrij-consent');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.isAnalyticsEnabled = parsed.consent.analytics;
      }
    } catch (error) {
      console.warn('Could not check analytics consent:', error);
    }
  }
  
  private calculateFatigueLevel(): number {
    const showCount = this.getShowCount();
    const rejectCount = this.getRejectionCount();
    
    // Simple fatigue calculation
    return Math.min(showCount + (rejectCount * 2), 10);
  }
  
  private getShowCount(): number {
    return this.events.filter(e => e.eventType === 'banner_shown').length;
  }
  
  private getRejectionCount(): number {
    return this.events.filter(e => 
      e.eventType === 'decision_made' && e.data.decision?.type === 'reject'
    ).length;
  }
  
  private calculateConversionRate(): number {
    const shows = this.getShowCount();
    const decisions = this.events.filter(e => e.eventType === 'decision_made').length;
    return shows > 0 ? (decisions / shows) * 100 : 0;
  }
  
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
  
  private calculateOptimalDelay(): number {
    const fatigueLevel = this.calculateFatigueLevel();
    const baseDelay = 2000;
    
    // Increase delay based on fatigue to reduce interruption
    return Math.min(baseDelay + (fatigueLevel * 500), 10000);
  }
  
  private determinePreferredPattern(): string {
    const interactions = this.events.filter(e => e.eventType === 'interaction');
    const expansions = interactions.filter(i => i.data.interaction?.type === 'expand').length;
    const toggles = interactions.filter(i => i.data.interaction?.type === 'toggle_category').length;
    
    if (expansions > toggles) return 'explore-first';
    if (toggles > expansions) return 'direct-customize';
    return 'quick-decide';
  }
  
  private calculatePerformanceScore(metrics: any): number {
    // Simple performance scoring (0-100)
    let score = 100;
    
    if (metrics.averageLoadTime > 100) score -= 20;
    if (metrics.averageMemoryUsage > 5) score -= 15;
    if (metrics.errorRate > 0.01) score -= 25;
    if (metrics.averageTimeToDecision > 10000) score -= 10;
    
    return Math.max(score, 0);
  }
  
  private generateRecommendations(metrics: any, fatigueLevel: number): string[] {
    const recommendations: string[] = [];
    
    if (fatigueLevel > 5) {
      recommendations.push('Reduce banner frequency to prevent consent fatigue');
    }
    
    if (metrics.averageTimeToDecision > 15000) {
      recommendations.push('Consider simplifying the consent interface');
    }
    
    if (metrics.expansionRate < 0.2) {
      recommendations.push('Make expanded view more discoverable');
    }
    
    if (metrics.rejectionRate > 0.8) {
      recommendations.push('Review value proposition in messaging');
    }
    
    return recommendations;
  }
  
  private calculateAggregateMetrics(): any {
    const decisionEvents = this.events.filter(e => e.eventType === 'decision_made');
    
    return {
      averageTimeToDecision: this.calculateAverage(
        decisionEvents.map(e => e.data.metrics?.timeToDecision || 0)
      ),
      averageLoadTime: this.calculateAverage(
        this.events.filter(e => e.eventType === 'performance')
                  .map(e => e.data.metrics?.loadTime || 0)
      ),
      averageMemoryUsage: this.calculateAverage(
        this.events.filter(e => e.eventType === 'performance')
                  .map(e => e.data.metrics?.memoryUsage || 0)
      ),
      expansionRate: this.calculateExpansionRate(),
      rejectionRate: this.calculateRejectionRate(),
      errorRate: this.events.filter(e => e.eventType === 'error').length / this.events.length,
    };
  }
  
  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
  
  private calculateExpansionRate(): number {
    const shows = this.getShowCount();
    const expansions = this.events.filter(e => 
      e.eventType === 'interaction' && e.data.interaction?.type === 'expand'
    ).length;
    
    return shows > 0 ? expansions / shows : 0;
  }
  
  private calculateRejectionRate(): number {
    const decisions = this.events.filter(e => e.eventType === 'decision_made').length;
    const rejections = this.getRejectionCount();
    
    return decisions > 0 ? rejections / decisions : 0;
  }
  
  private getFinalDecision(): string | undefined {
    const decisionEvents = this.events.filter(e => e.eventType === 'decision_made');
    const lastDecision = decisionEvents[decisionEvents.length - 1];
    
    return lastDecision?.data.decision?.type;
  }
  
  private sendToAnalytics(): void {
    if (!this.isAnalyticsEnabled) return;
    
    const data = this.exportData();
    
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'cookie_consent_analytics', {
        event_category: 'UX',
        event_label: 'session_complete',
        custom_parameters: {
          variant: data.variant.id,
          session_duration: data.summary.sessionDuration,
          final_decision: data.summary.finalDecision,
          conversion_rate: this.calculateConversionRate(),
          fatigue_level: this.calculateFatigueLevel(),
        },
      });
    }
    
    // Send to custom analytics endpoint
    fetch('/api/analytics/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(error => {
      console.warn('Failed to send analytics data:', error);
    });
  }
}

// Singleton analytics instance
let analyticsInstance: CookieConsentAnalytics | null = null;

export function getConsentAnalytics(userId?: string): CookieConsentAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new CookieConsentAnalytics(userId);
  }
  return analyticsInstance;
}

export function resetAnalytics(userId?: string): CookieConsentAnalytics {
  analyticsInstance = new CookieConsentAnalytics(userId);
  return analyticsInstance;
}

export { CookieConsentAnalytics };

// Global type declarations
declare global {
  function gtag(...args: any[]): void;
}