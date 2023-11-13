import { normalizeForMatch } from './normalize'

describe('normalizeForMatch', () => {
  it('should normalize strings correctly', () => {
    const val = '\nHello   World\n'
    expect(normalizeForMatch(val)).toBe('hello world')
  })

  it('should remove diacritics', () => {
    const val = 'Héllò'
    expect(normalizeForMatch(val)).toBe('hello')
  })

  it('should normalize dates correctly', () => {
    const val = new Date('2022-06-22T12:00:00+0200')
    expect(normalizeForMatch(val)).toBe('2022-06-22')
  })

  it('should normalize numbers correctly', () => {
    expect(normalizeForMatch(1.999)).toBe(2)
    expect(normalizeForMatch(1.99)).toBe(1.99)
    expect(normalizeForMatch(-100)).toBe(-100)
  })
})
