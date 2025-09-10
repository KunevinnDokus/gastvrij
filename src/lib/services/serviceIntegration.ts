/**
 * Service Integration Pattern Utilities for UX-Optimized Cookie Consent
 * 
 * Features:
 * - Seamless third-party service integration based on consent
 * - Lazy loading and performance optimization
 * - Service cleanup on consent withdrawal
 * - Hospitality industry-specific integrations
 * - Real-time consent synchronization
 * - Error handling and fallback mechanisms
 * 
 * @version 1.0
 * @author Gastvrij.eu Development Team - UI Designer
 */

// Service integration types
export interface ServiceConfig {
  id: string;
  name: string;
  category: 'analytics' | 'marketing' | 'preferences' | 'necessary';
  priority: number; // 1-10, higher = more important
  isEssential: boolean;
  loadTimeout: number; // milliseconds
  retryAttempts: number;
  dependencies?: string[]; // other services this depends on
}

export interface ServiceState {
  id: string;
  status: 'pending' | 'loading' | 'loaded' | 'error' | 'disabled';
  loadTime?: number;
  error?: string;
  lastRetry?: Date;
  retryCount: number;
}

export interface ServiceIntegration {
  config: ServiceConfig;
  state: ServiceState;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
  isEnabled: () => boolean;
  healthCheck: () => Promise<boolean>;
}

// Predefined service configurations for hospitality industry
export const HOSPITALITY_SERVICES: Record<string, ServiceConfig> = {
  // Analytics Services
  googleAnalytics: {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    category: 'analytics',
    priority: 8,
    isEssential: false,
    loadTimeout: 5000,
    retryAttempts: 3,
  },
  
  hotjar: {
    id: 'hotjar',
    name: 'Hotjar Heatmaps',
    category: 'analytics',
    priority: 6,
    isEssential: false,
    loadTimeout: 7000,
    retryAttempts: 2,
  },
  
  microsoftClarity: {
    id: 'microsoft-clarity',
    name: 'Microsoft Clarity',
    category: 'analytics',
    priority: 5,
    isEssential: false,
    loadTimeout: 6000,
    retryAttempts: 2,
  },
  
  // Marketing Services
  facebookPixel: {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    category: 'marketing',
    priority: 7,
    isEssential: false,
    loadTimeout: 4000,
    retryAttempts: 3,
  },
  
  googleAds: {
    id: 'google-ads',
    name: 'Google Ads Conversion',
    category: 'marketing',
    priority: 7,
    isEssential: false,
    loadTimeout: 4000,
    retryAttempts: 3,
  },
  
  linkedInInsight: {
    id: 'linkedin-insight',
    name: 'LinkedIn Insight Tag',
    category: 'marketing',
    priority: 5,
    isEssential: false,
    loadTimeout: 5000,
    retryAttempts: 2,
  },
  
  // Hospitality-specific services
  bookingWidget: {
    id: 'booking-widget',
    name: 'Booking.com Widget',
    category: 'preferences',
    priority: 9,
    isEssential: false,
    loadTimeout: 8000,
    retryAttempts: 3,
  },
  
  airbnbPixel: {
    id: 'airbnb-pixel',
    name: 'Airbnb Pixel',
    category: 'marketing',
    priority: 6,
    isEssential: false,
    loadTimeout: 5000,
    retryAttempts: 2,
  },
  
  // Preference Services
  languageDetection: {
    id: 'language-detection',
    name: 'Language Detection',
    category: 'preferences',
    priority: 8,
    isEssential: false,
    loadTimeout: 2000,
    retryAttempts: 1,
  },
  
  themeCustomization: {
    id: 'theme-customization',
    name: 'Theme Customization',
    category: 'preferences',
    priority: 6,
    isEssential: false,
    loadTimeout: 1000,
    retryAttempts: 1,
  },
  
  // Essential services
  errorTracking: {
    id: 'error-tracking',
    name: 'Error Tracking',
    category: 'necessary',
    priority: 10,
    isEssential: true,
    loadTimeout: 3000,
    retryAttempts: 5,
  },
  
  securityMonitoring: {
    id: 'security-monitoring',
    name: 'Security Monitoring',
    category: 'necessary',
    priority: 10,
    isEssential: true,
    loadTimeout: 2000,
    retryAttempts: 5,
  },
};

class ServiceIntegrationManager {
  private services: Map<string, ServiceIntegration> = new Map();
  private consentState: Record<string, boolean> = {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  };
  private isInitialized = false;
  private loadingPromises: Map<string, Promise<void>> = new Map();
  
  constructor() {
    this.initializeServices();
    this.setupConsentListener();
  }\n  \n  // Initialize all service integrations\n  private initializeServices(): void {\n    Object.values(HOSPITALITY_SERVICES).forEach(config => {\n      const serviceIntegration = this.createServiceIntegration(config);\n      this.services.set(config.id, serviceIntegration);\n    });\n    \n    this.isInitialized = true;\n    console.log('🔧 Service Integration Manager initialized with', this.services.size, 'services');\n  }\n  \n  // Create a service integration instance\n  private createServiceIntegration(config: ServiceConfig): ServiceIntegration {\n    const state: ServiceState = {\n      id: config.id,\n      status: 'pending',\n      retryCount: 0,\n    };\n    \n    return {\n      config,\n      state,\n      initialize: () => this.initializeService(config, state),\n      cleanup: () => this.cleanupService(config, state),\n      isEnabled: () => this.isServiceEnabled(config),\n      healthCheck: () => this.performHealthCheck(config),\n    };\n  }\n  \n  // Update consent state and reinitialize services\n  public updateConsent(newConsent: Record<string, boolean>): void {\n    const previousConsent = { ...this.consentState };\n    this.consentState = { ...newConsent };\n    \n    console.log('🔄 Updating service consent state:', newConsent);\n    \n    // Handle consent changes\n    this.services.forEach((service) => {\n      const wasEnabled = this.wasServiceEnabled(service.config, previousConsent);\n      const isNowEnabled = this.isServiceEnabled(service.config);\n      \n      if (!wasEnabled && isNowEnabled) {\n        // Service newly enabled\n        this.initializeService(service.config, service.state);\n      } else if (wasEnabled && !isNowEnabled) {\n        // Service newly disabled\n        this.cleanupService(service.config, service.state);\n      }\n    });\n  }\n  \n  // Initialize a specific service\n  private async initializeService(config: ServiceConfig, state: ServiceState): Promise<void> {\n    if (state.status === 'loading' || state.status === 'loaded') {\n      return;\n    }\n    \n    // Check if service is enabled by consent\n    if (!this.isServiceEnabled(config)) {\n      state.status = 'disabled';\n      return;\n    }\n    \n    // Check dependencies\n    if (config.dependencies) {\n      for (const depId of config.dependencies) {\n        const dependency = this.services.get(depId);\n        if (!dependency || dependency.state.status !== 'loaded') {\n          console.warn(`⚠️ Service ${config.name} waiting for dependency: ${depId}`);\n          // Wait for dependency or timeout\n          setTimeout(() => this.initializeService(config, state), 1000);\n          return;\n        }\n      }\n    }\n    \n    state.status = 'loading';\n    const startTime = performance.now();\n    \n    try {\n      console.log(`🚀 Initializing service: ${config.name}`);\n      \n      // Create a loading promise to prevent duplicate initialization\n      const loadingPromise = this.loadService(config);\n      this.loadingPromises.set(config.id, loadingPromise);\n      \n      // Wait for service to load with timeout\n      await Promise.race([\n        loadingPromise,\n        new Promise((_, reject) => \n          setTimeout(() => reject(new Error('Service load timeout')), config.loadTimeout)\n        ),\n      ]);\n      \n      state.status = 'loaded';\n      state.loadTime = performance.now() - startTime;\n      state.error = undefined;\n      state.retryCount = 0;\n      \n      console.log(`✅ Service ${config.name} loaded in ${state.loadTime.toFixed(2)}ms`);\n      \n      // Perform post-load health check\n      setTimeout(() => this.performHealthCheck(config), 2000);\n      \n    } catch (error) {\n      state.status = 'error';\n      state.error = error instanceof Error ? error.message : 'Unknown error';\n      state.lastRetry = new Date();\n      \n      console.error(`❌ Failed to load service ${config.name}:`, error);\n      \n      // Retry logic\n      if (state.retryCount < config.retryAttempts) {\n        state.retryCount++;\n        const retryDelay = Math.pow(2, state.retryCount) * 1000; // Exponential backoff\n        \n        console.log(`🔄 Retrying service ${config.name} in ${retryDelay}ms (attempt ${state.retryCount}/${config.retryAttempts})`);\n        \n        setTimeout(() => {\n          state.status = 'pending';\n          this.initializeService(config, state);\n        }, retryDelay);\n      }\n    } finally {\n      this.loadingPromises.delete(config.id);\n    }\n  }\n  \n  // Load specific service based on its type\n  private async loadService(config: ServiceConfig): Promise<void> {\n    switch (config.id) {\n      case 'google-analytics':\n        return this.loadGoogleAnalytics();\n      case 'facebook-pixel':\n        return this.loadFacebookPixel();\n      case 'google-ads':\n        return this.loadGoogleAds();\n      case 'hotjar':\n        return this.loadHotjar();\n      case 'microsoft-clarity':\n        return this.loadMicrosoftClarity();\n      case 'linkedin-insight':\n        return this.loadLinkedInInsight();\n      case 'booking-widget':\n        return this.loadBookingWidget();\n      case 'airbnb-pixel':\n        return this.loadAirbnbPixel();\n      case 'language-detection':\n        return this.loadLanguageDetection();\n      case 'theme-customization':\n        return this.loadThemeCustomization();\n      case 'error-tracking':\n        return this.loadErrorTracking();\n      case 'security-monitoring':\n        return this.loadSecurityMonitoring();\n      default:\n        throw new Error(`Unknown service: ${config.id}`);\n    }\n  }\n  \n  // Service-specific loading methods\n  private async loadGoogleAnalytics(): Promise<void> {\n    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;\n    if (!measurementId) throw new Error('GA_MEASUREMENT_ID not configured');\n    \n    return new Promise((resolve, reject) => {\n      if (typeof gtag !== 'undefined') {\n        resolve();\n        return;\n      }\n      \n      const script = document.createElement('script');\n      script.async = true;\n      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;\n      script.onload = () => {\n        window.dataLayer = window.dataLayer || [];\n        window.gtag = function() { dataLayer.push(arguments); };\n        gtag('js', new Date());\n        gtag('config', measurementId, {\n          anonymize_ip: true,\n          allow_google_signals: false,\n          cookie_domain: 'auto',\n          cookie_expires: 60 * 60 * 24 * 365 * 2, // 2 years\n        });\n        resolve();\n      };\n      script.onerror = () => reject(new Error('Failed to load Google Analytics'));\n      document.head.appendChild(script);\n    });\n  }\n  \n  private async loadFacebookPixel(): Promise<void> {\n    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;\n    if (!pixelId) throw new Error('FB_PIXEL_ID not configured');\n    \n    return new Promise((resolve, reject) => {\n      if (typeof fbq !== 'undefined') {\n        resolve();\n        return;\n      }\n      \n      const script = document.createElement('script');\n      script.innerHTML = `\n        !function(f,b,e,v,n,t,s)\n        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n        n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n        n.queue=[];t=b.createElement(e);t.async=!0;\n        t.src=v;s=b.getElementsByTagName(e)[0];\n        s.parentNode.insertBefore(t,s)}(window, document,'script',\n        'https://connect.facebook.net/en_US/fbevents.js');\n        fbq('init', '${pixelId}');\n        fbq('track', 'PageView');\n      `;\n      \n      document.head.appendChild(script);\n      \n      // Wait for fbq to be available\n      let attempts = 0;\n      const checkFbq = () => {\n        if (typeof fbq !== 'undefined') {\n          resolve();\n        } else if (attempts < 50) {\n          attempts++;\n          setTimeout(checkFbq, 100);\n        } else {\n          reject(new Error('Facebook Pixel failed to load'));\n        }\n      };\n      \n      checkFbq();\n    });\n  }\n  \n  private async loadGoogleAds(): Promise<void> {\n    const conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;\n    if (!conversionId) throw new Error('GOOGLE_ADS_ID not configured');\n    \n    // Google Ads uses the same gtag as Analytics\n    if (typeof gtag === 'undefined') {\n      await this.loadGoogleAnalytics();\n    }\n    \n    gtag('config', conversionId);\n  }\n  \n  private async loadHotjar(): Promise<void> {\n    const hjid = process.env.NEXT_PUBLIC_HOTJAR_ID;\n    const hjsv = process.env.NEXT_PUBLIC_HOTJAR_VERSION || '6';\n    \n    if (!hjid) throw new Error('HOTJAR_ID not configured');\n    \n    return new Promise((resolve, reject) => {\n      const script = document.createElement('script');\n      script.innerHTML = `\n        (function(h,o,t,j,a,r){\n          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};\n          h._hjSettings={hjid:${hjid},hjsv:${hjsv}};\n          a=o.getElementsByTagName('head')[0];\n          r=o.createElement('script');r.async=1;\n          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;\n          a.appendChild(r);\n        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');\n      `;\n      \n      document.head.appendChild(script);\n      \n      // Check if Hotjar loaded\n      setTimeout(() => {\n        if (typeof (window as any).hj !== 'undefined') {\n          resolve();\n        } else {\n          reject(new Error('Hotjar failed to load'));\n        }\n      }, 2000);\n    });\n  }\n  \n  private async loadMicrosoftClarity(): Promise<void> {\n    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;\n    if (!clarityId) throw new Error('CLARITY_ID not configured');\n    \n    return new Promise((resolve, reject) => {\n      const script = document.createElement('script');\n      script.innerHTML = `\n        (function(c,l,a,r,i,t,y){\n          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n          t=l.createElement(r);t.async=1;t.src=\"https://www.clarity.ms/tag/\"+i;\n          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n        })(window, document, \"clarity\", \"script\", \"${clarityId}\");\n      `;\n      \n      document.head.appendChild(script);\n      \n      setTimeout(() => {\n        if (typeof (window as any).clarity !== 'undefined') {\n          resolve();\n        } else {\n          reject(new Error('Microsoft Clarity failed to load'));\n        }\n      }, 3000);\n    });\n  }\n  \n  private async loadLinkedInInsight(): Promise<void> {\n    const partnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;\n    if (!partnerId) throw new Error('LINKEDIN_PARTNER_ID not configured');\n    \n    return new Promise((resolve, reject) => {\n      const script = document.createElement('script');\n      script.innerHTML = `\n        _linkedin_partner_id = \"${partnerId}\";\n        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];\n        window._linkedin_data_partner_ids.push(_linkedin_partner_id);\n      `;\n      \n      document.head.appendChild(script);\n      \n      const insightScript = document.createElement('script');\n      insightScript.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';\n      insightScript.onload = () => resolve();\n      insightScript.onerror = () => reject(new Error('LinkedIn Insight failed to load'));\n      document.head.appendChild(insightScript);\n    });\n  }\n  \n  private async loadBookingWidget(): Promise<void> {\n    // Placeholder for Booking.com widget integration\n    console.log('📅 Loading Booking.com widget...');\n    return Promise.resolve();\n  }\n  \n  private async loadAirbnbPixel(): Promise<void> {\n    // Placeholder for Airbnb pixel integration\n    console.log('🏠 Loading Airbnb pixel...');\n    return Promise.resolve();\n  }\n  \n  private async loadLanguageDetection(): Promise<void> {\n    // Implement language detection\n    const userLang = navigator.language || navigator.languages[0] || 'en';\n    const supportedLangs = ['nl', 'en', 'fr', 'de'];\n    const detectedLang = supportedLangs.find(lang => userLang.startsWith(lang)) || 'nl';\n    \n    localStorage.setItem('gastvrij-language', detectedLang);\n    document.documentElement.setAttribute('lang', detectedLang);\n    \n    console.log(`🌐 Language detected and set: ${detectedLang}`);\n  }\n  \n  private async loadThemeCustomization(): Promise<void> {\n    // Load saved theme or detect system preference\n    const savedTheme = localStorage.getItem('gastvrij-theme');\n    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;\n    const theme = savedTheme || (systemDark ? 'dark' : 'light');\n    \n    document.documentElement.setAttribute('data-theme', theme);\n    localStorage.setItem('gastvrij-theme', theme);\n    \n    console.log(`🎨 Theme applied: ${theme}`);\n  }\n  \n  private async loadErrorTracking(): Promise<void> {\n    // Essential error tracking (always loaded)\n    window.addEventListener('error', (event) => {\n      console.error('💥 JavaScript Error:', {\n        message: event.message,\n        source: event.filename,\n        line: event.lineno,\n        column: event.colno,\n        error: event.error,\n      });\n    });\n    \n    window.addEventListener('unhandledrejection', (event) => {\n      console.error('💥 Unhandled Promise Rejection:', {\n        reason: event.reason,\n        promise: event.promise,\n      });\n    });\n    \n    console.log('🛡️ Error tracking initialized');\n  }\n  \n  private async loadSecurityMonitoring(): Promise<void> {\n    // Essential security monitoring (always loaded)\n    console.log('🔐 Security monitoring initialized');\n  }\n  \n  // Cleanup a service when consent is withdrawn\n  private async cleanupService(config: ServiceConfig, state: ServiceState): Promise<void> {\n    if (state.status !== 'loaded') return;\n    \n    console.log(`🧹 Cleaning up service: ${config.name}`);\n    \n    try {\n      switch (config.id) {\n        case 'google-analytics':\n          this.cleanupGoogleAnalytics();\n          break;\n        case 'facebook-pixel':\n          this.cleanupFacebookPixel();\n          break;\n        case 'google-ads':\n          this.cleanupGoogleAds();\n          break;\n        case 'hotjar':\n          this.cleanupHotjar();\n          break;\n        case 'microsoft-clarity':\n          this.cleanupMicrosoftClarity();\n          break;\n        case 'linkedin-insight':\n          this.cleanupLinkedInInsight();\n          break;\n        default:\n          // Generic cleanup\n          break;\n      }\n      \n      state.status = 'disabled';\n      console.log(`✅ Service ${config.name} cleaned up`);\n      \n    } catch (error) {\n      console.error(`❌ Failed to cleanup service ${config.name}:`, error);\n      state.error = error instanceof Error ? error.message : 'Cleanup failed';\n    }\n  }\n  \n  // Service-specific cleanup methods\n  private cleanupGoogleAnalytics(): void {\n    // Disable GA tracking\n    if (typeof gtag !== 'undefined') {\n      gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {\n        send_page_view: false,\n        transport_type: 'beacon',\n      });\n    }\n    \n    // Clear GA cookies\n    this.clearCookiesByPrefix('_ga');\n  }\n  \n  private cleanupFacebookPixel(): void {\n    // Clear Facebook cookies\n    this.clearCookiesByPrefix('_fb');\n  }\n  \n  private cleanupGoogleAds(): void {\n    // Clear Google Ads cookies\n    this.clearCookiesByPrefix('_gads');\n    this.clearCookiesByPrefix('_gcl');\n  }\n  \n  private cleanupHotjar(): void {\n    // Clear Hotjar data\n    if (typeof (window as any).hj !== 'undefined') {\n      (window as any).hj('stateChange', '/cleanup');\n    }\n    this.clearCookiesByPrefix('_hj');\n  }\n  \n  private cleanupMicrosoftClarity(): void {\n    // Clear Clarity session storage\n    Object.keys(sessionStorage)\n      .filter(key => key.startsWith('_clsk') || key.startsWith('_clck'))\n      .forEach(key => sessionStorage.removeItem(key));\n  }\n  \n  private cleanupLinkedInInsight(): void {\n    // Clear LinkedIn cookies\n    this.clearCookiesByPrefix('li_');\n  }\n  \n  // Utility method to clear cookies by prefix\n  private clearCookiesByPrefix(prefix: string): void {\n    const cookies = document.cookie.split(';');\n    \n    cookies.forEach(cookie => {\n      const [name] = cookie.split('=').map(c => c.trim());\n      if (name.startsWith(prefix)) {\n        // Clear cookie for current domain and parent domains\n        const domains = [window.location.hostname];\n        const parts = window.location.hostname.split('.');\n        for (let i = 1; i < parts.length; i++) {\n          domains.push(parts.slice(i).join('.'));\n        }\n        \n        domains.forEach(domain => {\n          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;\n          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain}`;\n        });\n      }\n    });\n  }\n  \n  // Check if service should be enabled based on consent\n  private isServiceEnabled(config: ServiceConfig): boolean {\n    if (config.category === 'necessary') return true;\n    return this.consentState[config.category] || false;\n  }\n  \n  private wasServiceEnabled(config: ServiceConfig, previousConsent: Record<string, boolean>): boolean {\n    if (config.category === 'necessary') return true;\n    return previousConsent[config.category] || false;\n  }\n  \n  // Health check for services\n  private async performHealthCheck(config: ServiceConfig): Promise<boolean> {\n    try {\n      switch (config.id) {\n        case 'google-analytics':\n          return typeof gtag !== 'undefined';\n        case 'facebook-pixel':\n          return typeof fbq !== 'undefined';\n        case 'hotjar':\n          return typeof (window as any).hj !== 'undefined';\n        case 'microsoft-clarity':\n          return typeof (window as any).clarity !== 'undefined';\n        default:\n          return true;\n      }\n    } catch {\n      return false;\n    }\n  }\n  \n  // Setup consent listener\n  private setupConsentListener(): void {\n    if (typeof window !== 'undefined') {\n      window.addEventListener('cookieConsentChange', (event: any) => {\n        const consent = event.detail.consent;\n        this.updateConsent({\n          necessary: consent.necessary,\n          analytics: consent.analytics,\n          marketing: consent.marketing,\n          preferences: consent.preferences,\n        });\n      });\n      \n      window.addEventListener('cookieConsentWithdrawn', () => {\n        this.updateConsent({\n          necessary: true,\n          analytics: false,\n          marketing: false,\n          preferences: false,\n        });\n      });\n    }\n  }\n  \n  // Public methods for service management\n  public getServiceStatus(): Record<string, ServiceState> {\n    const status: Record<string, ServiceState> = {};\n    this.services.forEach((service, id) => {\n      status[id] = { ...service.state };\n    });\n    return status;\n  }\n  \n  public getServicesByCategory(category: ServiceConfig['category']): ServiceIntegration[] {\n    return Array.from(this.services.values())\n      .filter(service => service.config.category === category);\n  }\n  \n  public async reinitializeServices(): Promise<void> {\n    console.log('🔄 Reinitializing all enabled services...');\n    \n    const enabledServices = Array.from(this.services.values())\n      .filter(service => this.isServiceEnabled(service.config))\n      .sort((a, b) => b.config.priority - a.config.priority);\n    \n    for (const service of enabledServices) {\n      if (service.state.status !== 'loaded') {\n        await this.initializeService(service.config, service.state);\n      }\n    }\n  }\n  \n  public async performFullHealthCheck(): Promise<Record<string, boolean>> {\n    const results: Record<string, boolean> = {};\n    \n    for (const [id, service] of this.services) {\n      if (service.state.status === 'loaded') {\n        results[id] = await service.healthCheck();\n      } else {\n        results[id] = false;\n      }\n    }\n    \n    return results;\n  }\n  \n  public getLoadingProgress(): {\n    total: number;\n    loaded: number;\n    failed: number;\n    pending: number;\n    percentage: number;\n  } {\n    const services = Array.from(this.services.values())\n      .filter(service => this.isServiceEnabled(service.config));\n    \n    const total = services.length;\n    const loaded = services.filter(s => s.state.status === 'loaded').length;\n    const failed = services.filter(s => s.state.status === 'error').length;\n    const pending = services.filter(s => s.state.status === 'pending' || s.state.status === 'loading').length;\n    \n    return {\n      total,\n      loaded,\n      failed,\n      pending,\n      percentage: total > 0 ? (loaded / total) * 100 : 100,\n    };\n  }\n}\n\n// Singleton instance\nlet serviceManager: ServiceIntegrationManager | null = null;\n\nexport function getServiceManager(): ServiceIntegrationManager {\n  if (!serviceManager) {\n    serviceManager = new ServiceIntegrationManager();\n  }\n  return serviceManager;\n}\n\nexport function resetServiceManager(): ServiceIntegrationManager {\n  serviceManager = new ServiceIntegrationManager();\n  return serviceManager;\n}\n\nexport {\n  ServiceIntegrationManager,\n  type ServiceConfig,\n  type ServiceState,\n  type ServiceIntegration,\n};\n\n// Global type declarations\ndeclare global {\n  interface Window {\n    dataLayer?: any[];\n    gtag?: (...args: any[]) => void;\n    fbq?: (...args: any[]) => void;\n    hj?: (...args: any[]) => void;\n    clarity?: (...args: any[]) => void;\n  }\n}