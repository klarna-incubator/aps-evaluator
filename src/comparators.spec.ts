import { sub as subtractFromDate, add as addToDate } from 'date-fns'

import {
  compareDates,
  compareNumerics,
  compareOrderStatus,
  compareStrings,
  fullOrNoMatchComparison,
} from './comparators'
import { ALLOWED_DATE_DIFFERENCE_HOURS, MatchKey } from './constants'

describe('compareNumerics', () => {
  it('should strictly compare numbers when running without partial matching', () => {
    expect(compareNumerics(1, 1)).toEqual(MatchKey.FULL)
    expect(compareNumerics(1, 0.99)).toEqual(MatchKey.NO)
  })

  it('should allow partial matching within leeway', () => {
    expect(
      compareNumerics(1, 0.99, { allowPartialMatch: true, leeway: Math.abs(1 - 1 / 0.99) })
    ).toEqual(MatchKey.PARTIAL)

    expect(
      compareNumerics(1, 1.01, { allowPartialMatch: true, leeway: Math.abs(1 - 1 / 1.01) })
    ).toEqual(MatchKey.PARTIAL)
  })

  it('should partial match null and zero values when partial matching is enabled', () => {
    expect(compareNumerics(0, null, { allowPartialMatch: true })).toEqual(MatchKey.PARTIAL)
    expect(compareNumerics(null, 0, { allowPartialMatch: true })).toEqual(MatchKey.PARTIAL)
  })

  it('should not partial match null and zero values when partial matching is disabled', () => {
    expect(compareNumerics(0, null, { allowPartialMatch: false })).toEqual(MatchKey.NO)
    expect(compareNumerics(null, 0, { allowPartialMatch: false })).toEqual(MatchKey.NO)
  })
})

describe('fullOrNoMatchComparison', () => {
  it('should return match when values match', () => {
    expect(fullOrNoMatchComparison('foo', 'foo')).toEqual(MatchKey.FULL)
  })

  it('should return no match when values are different', () => {
    expect(fullOrNoMatchComparison('foo', 'food')).toEqual(MatchKey.NO)
  })
})

describe('compareStrings', () => {
  it('should return null when values to be compared are both null', () => {
    expect(compareStrings(null, null)).toEqual(null)
  })

  it('should stricly match strings as default', () => {
    expect(compareStrings('foo', 'food')).toEqual(MatchKey.NO)
  })

  it('should optionally allow partial string matching', () => {
    expect(compareStrings('foo', 'food', { allowPartialMatch: true })).toEqual(MatchKey.PARTIAL)
  })
})

describe('compareDates', () => {
  it('should handle null values correctly', () => {
    const someDate = new Date('2023-01-01T00:00:00.000Z')

    expect(compareDates(null, null)).toEqual(null)
    expect(compareDates(someDate, null)).toEqual(MatchKey.NO)
    expect(compareDates(null, someDate)).toEqual(MatchKey.NO)
  })

  it('should ignore hour and time component even when doing non-partial matching', () => {
    const date1 = new Date('2023-01-01T06:00:00Z')
    const date2 = new Date('2023-01-01T08:00:00Z')

    expect(compareDates(date1, date2)).toBe(MatchKey.FULL)
  })

  it('should handle partial date matching', () => {
    const date = new Date('2023-01-01T00:00:00.000Z')

    const date1 = subtractFromDate(date, { hours: ALLOWED_DATE_DIFFERENCE_HOURS })
    const date2 = addToDate(date, { hours: ALLOWED_DATE_DIFFERENCE_HOURS })

    expect(compareDates(date, date1, { allowPartialMatch: true })).toBe(MatchKey.PARTIAL)
    expect(compareDates(date1, date, { allowPartialMatch: true })).toBe(MatchKey.PARTIAL)

    expect(compareDates(date, date2, { allowPartialMatch: true })).toBe(MatchKey.PARTIAL)
    expect(compareDates(date2, date, { allowPartialMatch: true })).toBe(MatchKey.PARTIAL)

    expect(compareDates(date1, date2, { allowPartialMatch: true })).toBe(MatchKey.NO)
    expect(compareDates(date2, date1, { allowPartialMatch: true })).toBe(MatchKey.NO)
  })
})

describe('compareOrderStatus', () => {
  it('should handle null values correctly', () => {
    expect(compareOrderStatus(null, null)).toEqual(null)
  })

  it('should match if values match', () => {
    expect(compareOrderStatus('order_in_transit', 'order_in_transit')).toEqual(MatchKey.FULL)
  })

  it('should not match if values do not match', () => {
    expect(compareOrderStatus('order_confirmation', 'order_in_transit')).toEqual(MatchKey.NO)
  })

  it('should handle exceptions correctly', () => {
    expect(compareOrderStatus('order_in_transit', 'order_delayed')).toEqual(MatchKey.FULL)
    expect(compareOrderStatus('other', 'order_delayed')).toEqual(MatchKey.FULL)

    expect(compareOrderStatus('order_in_transit', 'order_delivery_failed')).toEqual(MatchKey.FULL)
    expect(compareOrderStatus('other', 'order_delivery_failed')).toEqual(MatchKey.FULL)

    expect(compareOrderStatus(null, 'other')).toEqual(MatchKey.FULL)
  })
})
