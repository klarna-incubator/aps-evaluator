import { differenceInHours } from 'date-fns'
import { difference, intersection, isEqual } from 'lodash'

import { ALLOWED_DATE_DIFFERENCE_HOURS, MAX_WRONG_TRIGRAMS } from './constants'
import { normalizeForMatch } from './normalize'
import { trigrams } from './trigram'

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

export const compareNumerics: ComparisonFn<number | null> = (parsed, labeled, options) => {
  if (parsed === null && labeled === null) return null
  if (parsed === null || labeled === null) return MatchKey.NO

  const match = fullOrNoMatchComparison(parsed, labeled)
  if (match === MatchKey.NO && options?.allowPartialMatch && options?.leeway) {
    const { upper, lower } = getUpperLowerLeewayBounds(labeled, options.leeway)
    const withinRange = parsed >= lower && parsed <= upper
    if (withinRange) {
      return MatchKey.PARTIAL
    }
  }
  return match
}

export const compareStrings: ComparisonFn<string | null> = (parsed, labeled, options) => {
  if (parsed === null && labeled === null) return null
  if (parsed === null || labeled === null) return MatchKey.NO

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
  if (parsed === null && labeled === null) return null
  if (parsed === null || labeled === null) return MatchKey.NO

  const match = fullOrNoMatchComparison(parsed, labeled)
  if (match === MatchKey.NO && parsed && labeled && options?.allowPartialMatch) {
    const hourDiff = differenceInHours(parsed, labeled)
    if (Math.abs(hourDiff) <= ALLOWED_DATE_DIFFERENCE_HOURS) {
      return MatchKey.PARTIAL
    }
  }

  return match
}

export const compareOrderStatus: ComparisonFn<string | null> = (parsed, labeled) => {
  if (parsed === null && labeled === null) return null

  const allowedStatusMapping: Record<string, (string | null)[]> = {
    order_delayed: ['other', 'order_in_transit'],
    order_delivery_failed: ['other', 'order_in_transit'],
    other: [null],
  }

  let match = isEqual(parsed, labeled) ? MatchKey.FULL : MatchKey.NO

  // Special Overrides
  const override = allowedStatusMapping[labeled as keyof typeof allowedStatusMapping]
  if (override && override.includes(parsed)) {
    match = MatchKey.FULL
  }

  return match
}
