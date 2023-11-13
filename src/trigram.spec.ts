import { trigrams } from './trigram'

describe('trigram', () => {
  const testString = 'trigram'
  const expected = ['tri', 'rig', 'igr', 'gra', 'ram']
  it('should succesfully split a string into the expected trigrams', () => {
    expect(trigrams(testString)).toEqual(expected)
  })
})
