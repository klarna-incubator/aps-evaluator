import { ComparisonResult } from '../compareWithLabeled'
import { ComparisonInput } from '../types'

export const createMockComparisonInput = (
  overrides?: Partial<ComparisonInput>
): ComparisonInput => ({
  carriers: null,
  coupon: null,
  currency: null,
  discount: null,
  giftCard: null,
  lineItems: null,
  merchantDomain: null,
  merchantName: null,
  orderDate: null,
  orderNumbers: null,
  shippingTotal: null,
  status: null,
  totalAmount: null,
  totalTaxAmount: null,
  trackingLinks: null,
  trackingNumbers: null,
  ...overrides,
})

export const createMockComparisonResult = (overrides?: Partial<ComparisonResult>) => {
  const result: ComparisonResult = {
    carriers: { match: null },
    costsAddUp: { match: null },
    coupon: { match: null },
    currency: { match: null },
    discount: { match: null },
    giftCard: { match: null },
    lineItemColor: { match: null },
    lineItemCount: { match: null },
    lineItemName: { match: null },
    lineItemProductId: { match: null },
    lineItemProductImageUrl: { match: null },
    lineItemQuantity: { match: null },
    lineItemSize: { match: null },
    lineItemUnitPrice: { match: null },
    lineItemUrl: { match: null },
    merchantDomain: { match: null },
    merchantName: { match: null },
    orderDate: { match: null },
    orderNumbers: { match: null },
    shippingTotal: { match: null },
    status: { match: null },
    totalAmount: { match: null },
    totalTaxAmount: { match: null },
    trackingLinks: { match: null },
    trackingNumbers: { match: null },
    ...overrides,
  }
  return result
}
