// Core application types for Gastvrij.eu

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
  
  // GDPR compliance
  gdprConsent: boolean
  gdprConsentDate?: Date
  dataRetention?: Date
  isActive: boolean
}

export interface Property {
  id: string
  name: string
  description?: string
  address: string
  city: string
  postalCode: string
  country: string
  latitude?: number
  longitude?: number
  
  propertyType: PropertyType
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  
  basePrice: number
  currency: string
  
  isActive: boolean
  isVerified: boolean
  
  createdAt: Date
  updatedAt: Date
  
  ownerId: string
  images: PropertyImage[]
  bookings: Booking[]
  reviews: Review[]
  availability: PropertyAvailability[]
}

export interface PropertyImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
  order: number
  createdAt: Date
  propertyId: string
}

export interface PropertyAvailability {
  id: string
  date: Date
  isAvailable: boolean
  price?: number
  propertyId: string
}

export interface Booking {
  id: string
  checkIn: Date
  checkOut: Date
  guests: number
  totalPrice: number
  currency: string
  
  status: BookingStatus
  paymentStatus: PaymentStatus
  
  guestName: string
  guestEmail: string
  guestPhone?: string
  specialRequests?: string
  
  createdAt: Date
  updatedAt: Date
  dataRetention?: Date
  
  propertyId: string
  userId?: string
  payments: Payment[]
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  transactionId?: string
  
  createdAt: Date
  updatedAt: Date
  
  bookingId: string
}

export interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  
  createdAt: Date
  updatedAt: Date
  dataRetention?: Date
  
  propertyId: string
  userId: string
}

// Enums
export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  STUDIO = 'STUDIO',
  ROOM = 'ROOM',
  VILLA = 'VILLA',
  CHALET = 'CHALET',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  IDEAL = 'IDEAL',
  BANCONTACT = 'BANCONTACT',
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface PropertyFormData {
  name: string
  description?: string
  address: string
  city: string
  postalCode: string
  country: string
  propertyType: PropertyType
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  basePrice: number
}

export interface BookingFormData {
  checkIn: string
  checkOut: string
  guests: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  specialRequests?: string
}

// GDPR Compliance types
export interface GDPRConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
  timestamp: Date
}

export interface DataRetentionPolicy {
  userData: number // days
  bookingData: number // days
  analyticsData: number // days
  marketingData: number // days
}

// Belgian-specific types
export interface BelgianAddress {
  street: string
  number: string
  postalCode: string
  city: string
  province: string
  country: 'Belgium'
}

export interface BelgianPaymentMethod {
  method: PaymentMethod
  provider: 'Stripe' | 'Mollie' | 'Bancontact' | 'iDEAL'
  isAvailable: boolean
}
