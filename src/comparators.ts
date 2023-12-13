import { differenceInHours } from 'date-fns'
import { difference, intersection, isEqual } from 'lodash'

import { ALLOWED_DATE_DIFFERENCE_HOURS, MAX_WRONG_TRIGRAMS, MatchKey } from './constants'
import { normalizeForMatch } from './normalize'
import { trigrams } from './trigram'
import { MultiPossibleValues } from './types'

export type ComparisonOptions = {
  leeway?: number
  allowPartialMatch?: boolean
}

export type ComparisonFn<T = unknown, U = T> = (
  parsed: T,
  labeled: U,
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
  const { allowPartialMatch = false, leeway } = options || {}
  if (parsed === null && labeled === null) return null
  if (parsed === 0 && labeled === null && allowPartialMatch) return MatchKey.PARTIAL
  if (parsed === null && labeled === 0 && allowPartialMatch) return MatchKey.PARTIAL
  if (parsed === null || labeled === null) return MatchKey.NO

  const match = fullOrNoMatchComparison(parsed, labeled)
  if (match === MatchKey.NO && allowPartialMatch && leeway) {
    const { upper, lower } = getUpperLowerLeewayBounds(labeled, leeway)
    const withinRange = parsed >= lower && parsed <= upper
    if (withinRange) {
      return MatchKey.PARTIAL
    }
  }
  return match
}

export const compareStrings: ComparisonFn<string | null, MultiPossibleValues | string | null> = (
  parsed,
  labeled,
  options
) => {
  if (parsed === null && labeled === null) return null
  if (parsed === null || labeled === null) return MatchKey.NO

  const labeledInputs = Array.isArray(labeled) ? labeled : [labeled]
  let hasPartialMatch = false

  for (const labeledInput of labeledInputs) {
    const match = fullOrNoMatchComparison(parsed, labeledInput)
    if (match === MatchKey.FULL) return match

    if (options?.allowPartialMatch) {
      const parsedTrigrams = trigrams(normalizeForMatch(parsed) as string)
      const labeledTrigrams = trigrams(normalizeForMatch(labeledInput) as string)
      const diff = difference(labeledTrigrams, parsedTrigrams)
      const intersect = intersection(labeledTrigrams, parsedTrigrams)
      if (diff.length <= MAX_WRONG_TRIGRAMS && intersect.length > 0) {
        hasPartialMatch = true
      }
    }
  }

  if (hasPartialMatch) return MatchKey.PARTIAL

  return MatchKey.NO
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
