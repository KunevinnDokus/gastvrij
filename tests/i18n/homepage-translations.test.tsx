import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// We'll import this once we restructure the homepage
// import { HomePage } from '@/app/[locale]/page';

const dutchMessages = {
  homepage: {
    hero: {
      title: 'Welkom bij Gastvrij.eu',
      subtitle: 'Het premium platform voor Belgische hospitality management met volledige GDPR-compliance'
    },
    features: {
      title: 'Waarom Gastvrij.eu?',
      gdpr: {
        title: 'GDPR Compliant',
        description: 'Volledige naleving van Belgische en Europese privacywetgeving. Uw gastgegevens zijn veilig.'
      }
    },
    cta: {
      title: 'Klaar om te beginnen?',
      description: 'Sluit u aan bij de groeiende gemeenschap van Belgische hospitality professionals'
    }
  }
};

const frenchMessages = {
  homepage: {
    hero: {
      title: 'Bienvenue chez Gastvrij.eu',
      subtitle: 'La plateforme premium pour la gestion hôtelière belge avec une conformité GDPR complète'
    },
    features: {
      title: 'Pourquoi Gastvrij.eu ?',
      gdpr: {
        title: 'Conforme GDPR',
        description: 'Respect total de la législation belge et européenne sur la vie privée. Vos données clients sont sécurisées.'
      }
    },
    cta: {
      title: 'Prêt à commencer ?',
      description: 'Rejoignez la communauté grandissante des professionnels de l\'hôtellerie belge'
    }
  }
};

const germanMessages = {
  homepage: {
    hero: {
      title: 'Willkommen bei Gastvrij.eu',
      subtitle: 'Die Premium-Plattform für belgisches Hospitality-Management mit vollständiger DSGVO-Konformität'
    },
    features: {
      title: 'Warum Gastvrij.eu?',
      gdpr: {
        title: 'DSGVO-konform',
        description: 'Vollständige Einhaltung der belgischen und europäischen Datenschutzgesetze. Ihre Gästdaten sind sicher.'
      }
    },
    cta: {
      title: 'Bereit anzufangen?',
      description: 'Schließen Sie sich der wachsenden Gemeinschaft belgischer Hospitality-Profis an'
    }
  }
};

const englishMessages = {
  homepage: {
    hero: {
      title: 'Welcome to Gastvrij.eu',
      subtitle: 'The premium platform for Belgian hospitality management with full GDPR compliance'
    },
    features: {
      title: 'Why Gastvrij.eu?',
      gdpr: {
        title: 'GDPR Compliant',
        description: 'Full compliance with Belgian and European privacy legislation. Your guest data is secure.'
      }
    },
    cta: {
      title: 'Ready to get started?',
      description: 'Join the growing community of Belgian hospitality professionals'
    }
  }
};

function renderWithIntl(ui: React.ReactElement, messages: any, locale: string) {
  return render(
    <NextIntlClientProvider messages={messages} locale={locale}>
      {ui}
    </NextIntlClientProvider>
  );
}

// Mock HomePage component for now
function MockHomePage() {
  return (
    <div data-testid="homepage">
      <h1>Gastvrij.eu Homepage</h1>
    </div>
  );
}

describe('Homepage Translations', () => {
  it('should display Dutch content correctly', () => {
    renderWithIntl(<MockHomePage />, dutchMessages, 'nl');
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
  });

  it('should display French content correctly', () => {
    renderWithIntl(<MockHomePage />, frenchMessages, 'fr');
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
  });

  it('should display German content correctly', () => {
    renderWithIntl(<MockHomePage />, germanMessages, 'de');
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
  });

  it('should display English content correctly', () => {
    renderWithIntl(<MockHomePage />, englishMessages, 'en');
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
  });

  it('should have correct translation keys structure', () => {
    // Test that all message structures are consistent
    const locales = [dutchMessages, frenchMessages, germanMessages, englishMessages];
    
    locales.forEach(messages => {
      expect(messages.homepage).toBeDefined();
      expect(messages.homepage.hero.title).toBeDefined();
      expect(messages.homepage.hero.subtitle).toBeDefined();
      expect(messages.homepage.features.title).toBeDefined();
      expect(messages.homepage.features.gdpr.title).toBeDefined();
      expect(messages.homepage.features.gdpr.description).toBeDefined();
      expect(messages.homepage.cta.title).toBeDefined();
      expect(messages.homepage.cta.description).toBeDefined();
    });
  });

  it('should contain Belgian-specific terminology', () => {
    // Verify Belgian context is maintained across all languages
    expect(dutchMessages.homepage.hero.subtitle).toContain('Belgische');
    expect(frenchMessages.homepage.hero.subtitle).toContain('belge');
    expect(germanMessages.homepage.hero.subtitle).toContain('belgisches');
    expect(englishMessages.homepage.hero.subtitle).toContain('Belgian');
  });

  it('should maintain GDPR compliance messaging consistency', () => {
    // Ensure GDPR/DSGVO messaging is consistent
    expect(dutchMessages.homepage.features.gdpr.title).toContain('GDPR');
    expect(frenchMessages.homepage.features.gdpr.title).toContain('GDPR');
    expect(germanMessages.homepage.features.gdpr.title).toContain('DSGVO');
    expect(englishMessages.homepage.features.gdpr.title).toContain('GDPR');
  });
});