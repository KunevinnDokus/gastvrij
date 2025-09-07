import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// GDPR Compliance Utilities
export function formatDateForGDPR(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function calculateDataRetentionDate(days: number = 2555): Date {
  const now = new Date()
  now.setDate(now.getDate() + days)
  return now
}

export function isDataRetentionExpired(retentionDate: Date): boolean {
  return new Date() > retentionDate
}

// Belgian-specific utilities
export function formatBelgianCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatBelgianDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-BE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Validation utilities
export function isValidBelgianPostalCode(postalCode: string): boolean {
  const belgianPostalCodeRegex = /^[1-9][0-9]{3}$/
  return belgianPostalCodeRegex.test(postalCode)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Mobile-first responsive utilities
export function getResponsiveClasses(base: string, sm?: string, md?: string, lg?: string, xl?: string) {
  return cn(base, sm, md, lg, xl)
}
