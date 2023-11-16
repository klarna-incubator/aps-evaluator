import { ComparisonInput } from './types'

const hasSeparateTaxLineItem = (
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

export const calculateOrderTotal = (input: ComparisonInput): number => {
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
