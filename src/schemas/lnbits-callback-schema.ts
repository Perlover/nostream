import { idSchema } from './base-schema'
import { z } from 'zod'

export const lnbitsCallbackQuerySchema = z
  .object({
    hmac: z.string().regex(/^[0-9]{1,20}:[0-9a-f]{64}$/),
  })
  .strict()

// LNbits posts its whole payment object (checking_id, amount, bolt11, status, ...).
// Only payment_hash is used; the invoice state is fetched from LNbits itself, so the
// other fields are stripped rather than rejected.
export const lnbitsCallbackBodySchema = z.object({
  payment_hash: idSchema,
})
