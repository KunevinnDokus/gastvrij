import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/homepage',
  useSearchParams: () => new URLSearchParams(),
}));

// We'll create this component in the implementation phase
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const messages = {
  common: {
    language: {
      nederlands: 'Nederlands',
      francais: 'Français', 
      deutsch: 'Deutsch',
      english: 'English',
      current: 'Huidige taal',
      switchTo: 'Schakel over naar {language}',
    }
  }
};

function renderWithIntl(ui: React.ReactElement, locale = 'nl') {
  return render(
    <NextIntlClientProvider messages={messages} locale={locale}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('LanguageSwitcher', () => {
  it('should display current language correctly', () => {
    renderWithIntl(<LanguageSwitcher currentLocale="nl" />);
    
    expect(screen.getByText('Nederlands')).toBeInTheDocument();
  });

  it('should show all available languages in dropdown', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher currentLocale="nl" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should call router.replace when language is selected', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher currentLocale="nl" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const frenchOption = screen.getByText('Français');
    await user.click(frenchOption);
    
    expect(mockReplace).toHaveBeenCalledWith('/fr/homepage');
  });

  it('should preserve query parameters when switching languages', async () => {
    // Mock useSearchParams to return query params
    vi.mock('next/navigation', () => ({
      useRouter: () => ({
        replace: mockReplace,
      }),
      usePathname: () => '/homepage',
      useSearchParams: () => new URLSearchParams('search=test&category=hotels'),
    }));

    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher currentLocale="nl" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const germanOption = screen.getByText('Deutsch');
    await user.click(germanOption);
    
    expect(mockReplace).toHaveBeenCalledWith('/de/homepage?search=test&category=hotels');
  });

  it('should be accessible with proper ARIA attributes', () => {
    renderWithIntl(<LanguageSwitcher currentLocale="nl" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-label');
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher currentLocale="nl" />);
    
    const button = screen.getByRole('button');
    
    // Open with Enter key
    await user.keyboard('{Tab}');
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Navigate with arrow keys
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Français')).toHaveFocus();
  });
});