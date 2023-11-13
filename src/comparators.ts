import { differenceInHours } from 'date-fns'
import { difference, inRange, intersection, isEqual } from 'lodash'

import { ALLOWED_DATE_DIFFERENCE_HOURS, LEEWAY, MAX_WRONG_TRIGRAMS } from './constants'
import { normalizeForMatch } from './normalize'
import { trigrams } from './trigram'
import { ComparisonInput } from './types'

export enum MatchKey {
  FULL = 'Full match',
  PARTIAL = 'Partial Match',
  NO = 'No match',
}

export type ComparisonOptions = {
  leeway?: number
  allowPartialMatch?: boolean
}

export type ComparisonFn<T = unknown> = (
  parsed: T,
  labeled: T,
  options?: ComparisonOptions
) => MatchKey | null

const getUpperLowerLeewayBounds = (
  value: number,
  leeway: number
): { upper: number; lower: number } => {
  return { upper: value + value * leeway, lower: value - value * leeway }
}

export const fullOrNoMatchComparison: ComparisonFn = (parsed, labeled) => {
  return isEqual(normalizeForMatch(parsed), normalizeForMatch(labeled))
    ? MatchKey.FULL
    : MatchKey.NO
}

export const compareNumerics: ComparisonFn<number> = (parsed, labeled, options) => {
  const match = fullOrNoMatchComparison(parsed, labeled)
  if (match === MatchKey.NO && options?.allowPartialMatch && options?.leeway) {
    const { upper, lower } = getUpperLowerLeewayBounds(labeled, options.leeway)
    const withinRange = inRange(parsed, upper, lower)
    if (withinRange) {
      return MatchKey.PARTIAL
    }
  }
  return match
}

export const compareStrings: ComparisonFn<string> = (parsed, labeled, options) => {
  const match = fullOrNoMatchComparison(parsed, labeled)
  if (match === MatchKey.NO && options?.allowPartialMatch) {
    const parsedTrigrams = trigrams(normalizeForMatch(parsed) as string)
    const labeledTrigrams = trigrams(normalizeForMatch(labeled) as string)
    const diff = difference(labeledTrigrams, parsedTrigrams)
    const intersect = intersection(labeledTrigrams, parsedTrigrams)
    if (diff.length <= MAX_WRONG_TRIGRAMS && intersect.length > 0) {
      return MatchKey.PARTIAL
    }
  }

  return match
}

export const compareDates: ComparisonFn<Date | null> = (parsed, labeled, options) => {
  const match = fullOrNoMatchComparison(parsed, labeled)
  if (match === MatchKey.NO && parsed && labeled && options?.allowPartialMatch) {
    const hourDiff = differenceInHours(parsed, labeled)
    if (Math.abs(hourDiff) <= ALLOWED_DATE_DIFFERENCE_HOURS) {
      return MatchKey.PARTIAL
    }
  }

  return match
}

export const compareOrderStatus: ComparisonFn<string> = (parsed, labeled) => {
  const allowedStatusMapping: Record<string, (string | null)[]> = {
    order_delayed: ['other', 'order_in_transit'],
    order_delivery_failed: ['other', 'order_in_transit'],
    other: [null],
  }

  let match = isEqual(parsed, labeled) ? MatchKey.FULL : MatchKey.NO

  // Special Overrides
  if (allowedStatusMapping[labeled] && allowedStatusMapping[labeled].includes(parsed)) {
    match = MatchKey.FULL
  }

  return match
}

export const hasSeparateTaxLineItem = (
  parsed: ComparisonInput,
  calculatedTotalAmount: number
): boolean => {
  const MAX_TAX_RATE = 0.25
  const CURRENCIES_WITH_SEPARATE_TAX_LINE_ITEM = ['USD']

  if (parsed.currency && !CURRENCIES_WITH_SEPARATE_TAX_LINE_ITEM.includes(parsed.currency)) {
    return true
  }

  if (!parsed.lineItems?.length) return false
  if (!parsed.totalTaxAmount) return true
  if (!parsed.totalAmount) return true

  const calculatedTaxRate = parsed.totalTaxAmount / parsed.totalAmount
  if (calculatedTaxRate > MAX_TAX_RATE) {
    return false
  }

  return calculatedTotalAmount <= parsed.totalAmount
}

const calculateOrderTotal = (input: ComparisonInput): number => {
  const lineItemsCosts =
    input.lineItems?.reduce(
      (previousValue, lineItem) =>
        previousValue + (lineItem.quantity ?? 1) * (lineItem.unitPrice ?? 0),
      0
    ) ?? 0
  const orderCosts = input.shippingTotal ?? 0
  const discounts = (input.coupon ?? 0) + (input.discount ?? 0) + (input.giftCard ?? 0)

  const calculatedTotalAmount = lineItemsCosts + orderCosts - discounts

  return hasSeparateTaxLineItem(input, calculatedTotalAmount)
    ? calculatedTotalAmount + (input.totalTaxAmount ?? 0)
    : calculatedTotalAmount
}

export const compareCostsAddUp: ComparisonFn<ComparisonInput> = (parsed, labeled) => {
  const expectedTotal = labeled?.totalAmount
  if (!expectedTotal) return null

  const calculatedTotalParsed = calculateOrderTotal(parsed)
  const calculatedTotalLabeled = calculateOrderTotal(labeled)

  // We also account up for leniency when comparing out computed total against the labeled total
  const computedCostsMatchExpectedTotal = compareNumerics(calculatedTotalLabeled, expectedTotal, {
    allowPartialMatch: true,
    leeway: LEEWAY.costsAddUp,
  })

  // If the total amounts don't add up in the labeled data we shouldn't penalize them not doing
  // so in the parsed data either
  if (computedCostsMatchExpectedTotal === MatchKey.NO) {
    return null
  }

  return compareNumerics(calculatedTotalParsed, expectedTotal, {
    allowPartialMatch: true,
    leeway: LEEWAY.costsAddUp,
  })
}
