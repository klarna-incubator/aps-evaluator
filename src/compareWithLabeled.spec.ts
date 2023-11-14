import { MatchKey } from './comparators'
import {
  calculateAPS,
  createMismatchComment,
  evaluateArray,
  evaluateField,
  evaluateLineItemCount,
  evaluateLineItemFields,
} from './compareWithLabeled'
import { createMockComparisonInput, createMockComparisonResult } from './testUtils'
import { LineItem } from './types'

describe('createMismatchComment', () => {
  it('should return an empty string for a full match', () => {
    const result = createMismatchComment(MatchKey.FULL, 'parsed', 'expected')
    expect(result).toBe('')
  })

  it('should return a formatted string for a partial match', () => {
    const result = createMismatchComment(MatchKey.PARTIAL, 'parsed', 'expected')
    expect(result).toBe('expected "expected" but got partial match "parsed"')
  })

  it('should return a formatted string for no match', () => {
    const result = createMismatchComment(MatchKey.NO, 'parsed', 'expected')
    expect(result).toBe('expected "expected" but got "parsed"')
  })

  it('should format date values', () => {
    const date = new Date(2022, 0, 1) // January 1, 2022
    const result = createMismatchComment(MatchKey.NO, date, date)
    expect(result).toBe('expected "2022-01-01" but got "2022-01-01"')
  })

  it('should work with optional prefix', () => {
    const result = createMismatchComment(MatchKey.NO, 'expected', 'parsed', 'prefix')
    expect(result).toBe('prefix expected "parsed" but got "expected"')
  })
})

describe('evaluateField', () => {
  const mockComparator = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  const parsed = createMockComparisonInput({
    status: null,
    orderDate: new Date('2023-11-08T12:00:00Z'),
  })

  const labeled = createMockComparisonInput({
    status: null,
    orderDate: new Date('2023-08-11T00:00:00Z'),
  })

  it('should return null match for null values', () => {
    const result = evaluateField('status', parsed, labeled, mockComparator)
    expect(result).toEqual({ match: null })
  })

  it('should return match and comments for non-null values', () => {
    mockComparator.mockReturnValue(MatchKey.NO)
    const result = evaluateField('orderDate', parsed, labeled, mockComparator)
    expect(result).toEqual({
      match: MatchKey.NO,
      comments: ['expected "2023-08-11" but got "2023-11-08"'],
    })
  })
})

describe('evaluateArray', () => {
  const mockComparator = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return null match for null values', () => {
    const result = evaluateArray('fieldName', null, null, mockComparator)
    expect(result).toEqual({ match: null })
  })

  it('should return full match for equal arrays', () => {
    mockComparator.mockReturnValue(MatchKey.FULL)
    const expectedComparatorOptions = undefined

    const result = evaluateArray('fieldName', ['parsed'], ['expected'], mockComparator)

    expect(mockComparator).toHaveBeenCalledTimes(1)
    expect(mockComparator).toHaveBeenLastCalledWith('parsed', 'expected', expectedComparatorOptions)
    expect(result).toEqual({ match: MatchKey.FULL, comments: null })
  })

  it('should return no match and comment for different length arrays', () => {
    const result = evaluateArray('fieldName', ['parsed'], [], mockComparator)
    expect(result).toEqual({ match: MatchKey.NO, comments: ['expected 0 results but got 1'] })
  })

  it('should return partial match and comment for partially matching arrays', () => {
    mockComparator.mockReturnValue(MatchKey.PARTIAL)

    const result = evaluateArray('fieldName', ['parsed'], ['expected'], mockComparator)
    expect(result).toEqual({
      match: MatchKey.PARTIAL,
      comments: ['fieldName[0] expected "expected" but got partial match "parsed"'],
    })
  })

  it('should return no match and comment for non-matching arrays', () => {
    mockComparator.mockReturnValue(MatchKey.NO)
    const result = evaluateArray('fieldName', ['parsed'], ['expected'], mockComparator)
    expect(result).toEqual({
      match: MatchKey.NO,
      comments: ['fieldName[0] expected "expected" but got "parsed"'],
    })
  })
})

describe('evaluateLineItemFields', () => {
  it('should return null matches for null values', () => {
    const result = evaluateLineItemFields(null, null)
    expect(result).toEqual({
      lineItemName: { match: null },
      lineItemColor: { match: null },
      lineItemProductId: { match: null },
      lineItemProductImageUrl: { match: null },
      lineItemQuantity: { match: null },
      lineItemSize: { match: null },
      lineItemUnitPrice: { match: null },
      lineItemUrl: { match: null },
    })
  })

  it('should evaluate each field', () => {
    const parsed = [
      {
        name: 'success',
        color: 'parsed',
        productId: 'parsed',
        imageUrl: 'parsed',
        quantity: null,
        size: 'parsed',
        unitPrice: 1,
        url: null,
      },
    ]

    const labeled = [
      {
        name: 'successful',
        color: 'expected',
        productId: 'expected',
        imageUrl: 'expected',
        quantity: 1,
        size: 'expected',
        unitPrice: 1,
        url: null,
      },
    ]

    const result = evaluateLineItemFields(parsed, labeled)

    expect(result).toMatchObject({
      lineItemName: { match: MatchKey.PARTIAL },
      lineItemColor: { match: MatchKey.NO },
      lineItemProductId: { match: MatchKey.NO },
      lineItemProductImageUrl: { match: MatchKey.NO },
      lineItemQuantity: { match: MatchKey.FULL },
      lineItemSize: { match: MatchKey.NO },
      lineItemUnitPrice: { match: MatchKey.FULL },
      lineItemUrl: { match: null },
    })
  })
})

describe('evaluateLineItemCount', () => {
  it('should return null match for null values', () => {
    const result = evaluateLineItemCount(null, null)
    expect(result).toEqual({ match: null })
  })

  it('should return full match for equal counts', () => {
    const parsed: LineItem[] = [
      {
        name: 'foo',
      } as LineItem,
    ]
    const labeled: LineItem[] = [
      {
        name: 'bar',
      } as LineItem,
    ]
    const result = evaluateLineItemCount(parsed, labeled)
    expect(result).toEqual({ match: MatchKey.FULL })
  })

  it('should return no match and comment for different counts', () => {
    const parsed: LineItem[] = [
      {
        name: 'foo',
      } as LineItem,
    ]
    const labeled: LineItem[] = [
      {
        name: 'bar',
      } as LineItem,
      {
        name: 'baz',
      } as LineItem,
    ]
    const result = evaluateLineItemCount(parsed, labeled)
    expect(result).toEqual({ match: MatchKey.NO, comments: ['expected 2 results but got 1'] })
  })

  it('should return full match when one is empty and one is null', () => {
    const parsed: LineItem[] = []
    const labeled = null
    const result = evaluateLineItemCount(parsed, labeled)
    expect(result).toEqual({ match: MatchKey.FULL })
  })
})

describe('calculateAPS', () => {
  it('should return 1 if all APS fields are matches, partial matches or null', () => {
    const comparisonResult = createMockComparisonResult({
      carriers: { match: MatchKey.FULL },
      orderDate: { match: MatchKey.PARTIAL },
    })

    const result = calculateAPS(comparisonResult)

    expect(result).toBe(1)
  })

  it('should not be negatively affected by non-APS fields', () => {
    const comparisonResult = createMockComparisonResult({
      carriers: { match: MatchKey.FULL },
      orderDate: { match: MatchKey.PARTIAL },
      lineItemColor: { match: MatchKey.NO }, // Line item color is not an APS field
    })

    const result = calculateAPS(comparisonResult)

    expect(result).toBe(1)
  })

  it('should return 0 if APS fields are not matching', () => {
    const comparisonResult = createMockComparisonResult({
      carriers: { match: MatchKey.NO },
      orderDate: { match: MatchKey.FULL },
    })

    const result = calculateAPS(comparisonResult)

    expect(result).toBe(0)
  })

  it('should return 1 if carrier and tracking numbers matche but tracking link does not', () => {
    const comparisonResult = createMockComparisonResult({
      carriers: { match: MatchKey.FULL },
      trackingLinks: { match: MatchKey.NO },
      trackingNumbers: { match: MatchKey.FULL },
    })

    const result = calculateAPS(comparisonResult)

    expect(result).toBe(1)
  })

  it('should return 0 if tracking link does not match and carrier and tracking numbers are not present', () => {
    const comparisonResult = createMockComparisonResult({
      trackingLinks: { match: MatchKey.NO },
    })

    const result = calculateAPS(comparisonResult)

    expect(result).toBe(0)
  })
})