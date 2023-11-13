import { cloneDeep } from 'lodash'

import { MatchKey, compareCostsAddUp } from './comparators'
import { createMockComparisonInput } from './testUtils'
import { LineItem } from './types'

describe('compareCostsAddUp', () => {
  it('should return full match if costs are adding up', () => {
    const parsed = createMockComparisonInput({
      totalAmount: 100,
      shippingTotal: 2.5,
      coupon: 5,
      giftCard: 10,
      totalTaxAmount: 20,
      currency: 'USD',
      discount: 30,
      lineItems: [
        {
          unitPrice: 10,
          quantity: 5,
        } as LineItem,
        {
          unitPrice: 72.5,
          quantity: null,
        } as LineItem,
      ],
    })
    const labeled = cloneDeep(parsed)

    const result = compareCostsAddUp(parsed, labeled)
    expect(result).toEqual(MatchKey.FULL)
  })

  it('should return null if costs are not adding up in either of the labeled and the parsed', () => {
    const parsed = createMockComparisonInput({
      totalAmount: 100,
      lineItems: [
        {
          unitPrice: 10,
          quantity: 5,
        } as LineItem,
      ],
    })
    const labeled = cloneDeep(parsed)

    const result = compareCostsAddUp(parsed, labeled)

    expect(result).toEqual(null)
  })

  it('should return no match if costs are adding up in the labeled but not the parsed', () => {
    const parsed = createMockComparisonInput({
      totalAmount: 100,
      lineItems: [
        {
          unitPrice: 10,
          quantity: 5,
        } as LineItem,
      ],
    })
    const labeled = createMockComparisonInput({
      totalAmount: 100,
      lineItems: [
        {
          unitPrice: 10,
          quantity: 10,
        } as LineItem,
      ],
    })

    const result = compareCostsAddUp(parsed, labeled)

    expect(result).toEqual(MatchKey.NO)
  })
})
