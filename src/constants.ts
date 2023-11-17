import { ComparisonResult } from './types'

// Note: This LEEWAY is represented as percentages
export const LEEWAY = {
  coupon: 0.05,
  discount: 0.005,
  giftCard: 0.05,
  shippingTotal: 0.5,
  totalAmount: 0.01,
  totalTaxAmount: 0.02,
  costsAddUp: 0.05,
  lineItemUnitPrice: 0.01,
} as const

export const MAX_WRONG_TRIGRAMS = 5
export const ALLOWED_DATE_DIFFERENCE_HOURS = 24

export enum MatchKey {
  FULL = 'Full match',
  PARTIAL = 'Partial Match',
  NO = 'No match',
}

type ApsFields = Readonly<Array<keyof Omit<ComparisonResult, 'APS'>>>

export const APS_FIELDS: ApsFields = [
  'carriers',
  'costsAddUp',
  'currency',
  'lineItemCount',
  'lineItemName',
  'lineItemProductImageUrl',
  'lineItemUnitPrice',
  'merchantName',
  'orderDate',
  'orderNumbers',
  'status',
  'totalAmount',
  'trackingLinks',
  'trackingNumbers',
] as const
