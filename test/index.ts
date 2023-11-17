import { compareWithLabeled } from '../src/index'

const main = () => {
  const parsed = {
    carriers: ['carrier1', 'carrier2'],
    coupon: 10,
    currency: 'USD',
    discount: 20,
    giftCard: 50,
    lineItems: [
      {
        color: 'red',
        imageUrl: 'http://example.com/image1.png',
        name: 'Item 1',
        productId: 'id1',
        quantity: 1,
        size: 'large',
        unitPrice: 150,
        url: 'http://example.com/item1',
      },
      {
        color: 'blue',
        imageUrl: 'http://example.com/image2.png',
        name: 'Item 2',
        productId: 'id2',
        quantity: 3,
        size: 'medium',
        unitPrice: 80,
        url: 'http://example.com/item2',
      },
    ],
    merchantDomain: 'example.com',
    merchantName: 'Merchant 1',
    orderDate: new Date('2021-12-01T00:00:00Z'),
    orderNumbers: ['order1', 'order2'],
    shippingTotal: 30,
    status: 'delivered',
    totalAmount: 350,
    totalTaxAmount: 50,
    trackingLinks: ['http://trackinglink1.com', 'http://trackinglink2.com'],
    trackingNumbers: ['trackingNumber1', 'trackingNumber2'],
  }

  const labeled = {
    ...parsed,
    totalAmount: 400,
  }

  const result = compareWithLabeled({
    parsed,
    labeled,
  })

  console.log(result)

  return result
}

main()
