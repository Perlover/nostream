import { lnbitsCallbackBodySchema, lnbitsCallbackQuerySchema } from '../../../src/schemas/lnbits-callback-schema'
import { expect } from 'chai'
import { validateSchema } from '../../../src/utils/validation'

describe('LNbits Callback Schema', () => {
  describe('lnbitsCallbackQuerySchema', () => {
    it('returns no error if hmac is valid', () => {
      const query = { hmac: '1660306803:fa4dd948576fe182f5d0e3120b9df42c83dffa1c884754d5e4d3b0a2f98a01c5' }
      const result = validateSchema(lnbitsCallbackQuerySchema)(query)
      expect(result.error).to.be.undefined
      expect(result.value).to.deep.include(query)
    })

    it('returns error if hmac is missing', () => {
      const result = validateSchema(lnbitsCallbackQuerySchema)({})
      expect(result.error).to.exist
      expect(result.error?.issues[0].path).to.deep.equal(['hmac'])
    })

    it('returns error if hmac format is invalid', () => {
      const result = validateSchema(lnbitsCallbackQuerySchema)({ hmac: 'not-an-hmac' })
      expect(result.error).to.exist
      expect(result.error?.issues[0].path).to.deep.equal(['hmac'])
    })
  })

  describe('lnbitsCallbackBodySchema', () => {
    it('returns no error if payment_hash is valid', () => {
      const body = { payment_hash: 'fa4dd948576fe182f5d0e3120b9df42c83dffa1c884754d5e4d3b0a2f98a01c5' }
      const result = validateSchema(lnbitsCallbackBodySchema)(body)
      expect(result.error).to.be.undefined
    })

    it('accepts the whole LNbits payment object and keeps only payment_hash', () => {
      const paymentHash = 'fa4dd948576fe182f5d0e3120b9df42c83dffa1c884754d5e4d3b0a2f98a01c5'
      const body = {
        checking_id: paymentHash,
        payment_hash: paymentHash,
        wallet_id: 'c'.repeat(32),
        amount: 21000,
        fee: 0,
        bolt11: 'lnbc210n1test',
        status: 'success',
        time: '2030-01-01T00:00:00+00:00',
        extra: {},
      }
      const result = validateSchema(lnbitsCallbackBodySchema)(body)
      expect(result.error).to.be.undefined
      expect(result.value).to.deep.equal({ payment_hash: paymentHash })
    })

    it('returns error if payment_hash is missing', () => {
      const result = validateSchema(lnbitsCallbackBodySchema)({ checking_id: 'abc' })
      expect(result.error).to.exist
      expect(result.error?.issues[0].path).to.deep.equal(['payment_hash'])
    })

    it('returns error if payment_hash is not 64 chars hex', () => {
      const result = validateSchema(lnbitsCallbackBodySchema)({ payment_hash: 'abc' })
      expect(result.error).to.exist
      expect(result.error?.issues[0].path).to.deep.equal(['payment_hash'])
    })
  })
})
