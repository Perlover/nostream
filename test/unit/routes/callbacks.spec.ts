import axios from 'axios'
import { expect } from 'chai'
import express from 'express'
import Sinon from 'sinon'

import * as lnbitsControllerFactory from '../../../src/factories/controllers/lnbits-callback-controller-factory'
import * as openNodeControllerFactory from '../../../src/factories/controllers/opennode-callback-controller-factory'
import * as settingsFactory from '../../../src/factories/settings-factory'

describe('callbacks router', () => {
  let createLNbitsCallbackControllerStub: Sinon.SinonStub
  let createOpenNodeCallbackControllerStub: Sinon.SinonStub
  let createSettingsStub: Sinon.SinonStub
  let receivedBody: unknown
  let processor: string
  let server: any

  beforeEach(async () => {
    receivedBody = undefined
    processor = 'opennode'

    createSettingsStub = Sinon.stub(settingsFactory, 'createSettings').callsFake(
      () =>
        ({
          payments: { enabled: true, processor },
        }) as any,
    )

    createOpenNodeCallbackControllerStub = Sinon.stub(openNodeControllerFactory, 'createOpenNodeCallbackController').returns({
      handleRequest: async (request: any, response: any) => {
        receivedBody = request.body
        response.status(200).send('OK')
      },
    } as any)

    createLNbitsCallbackControllerStub = Sinon.stub(lnbitsControllerFactory, 'createLNbitsCallbackController').returns({
      handleRequest: async (request: any, response: any) => {
        receivedBody = request.body
        response.status(200).send('OK')
      },
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    delete require.cache[require.resolve('../../../src/routes/callbacks')]
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const router = require('../../../src/routes/callbacks').default

    const app = express()
    app.use(router)

    server = await new Promise((resolve) => {
      const listeningServer = app.listen(0, () => resolve(listeningServer))
    })
  })

  afterEach(async () => {
    createLNbitsCallbackControllerStub.restore()
    createOpenNodeCallbackControllerStub.restore()
    createSettingsStub.restore()
    delete require.cache[require.resolve('../../../src/routes/callbacks')]

    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error: Error | undefined) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
    }
  })

  it('parses form-urlencoded OpenNode callbacks', async () => {
    const { port } = server.address()
    const response = await axios.post(
      `http://127.0.0.1:${port}/opennode`,
      new URLSearchParams({
        hashed_order: 'signature',
        id: 'invoice-id',
        order_id: 'pubkey',
        status: 'paid',
      }).toString(),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true,
      },
    )

    expect(response.status).to.equal(200)
    expect(receivedBody).to.deep.equal({
      hashed_order: 'signature',
      id: 'invoice-id',
      order_id: 'pubkey',
      status: 'paid',
    })
  })

  it('passes the JSON string body LNbits >= 1.0 posts through to the controller', async () => {
    processor = 'lnbits'
    const { port } = server.address()
    const payment = JSON.stringify({ checking_id: 'a'.repeat(64), payment_hash: 'a'.repeat(64), amount: 21000 })

    // LNbits >= 1.0 sends `json=payment.json()`: the serialized payment JSON-encoded again
    const response = await axios.post(`http://127.0.0.1:${port}/lnbits`, JSON.stringify(payment), {
      headers: {
        'content-type': 'application/json',
      },
      validateStatus: () => true,
    })

    expect(response.status).to.equal(200)
    expect(receivedBody).to.equal(payment)
  })

  it('parses the LNbits payment object as JSON', async () => {
    processor = 'lnbits'
    const { port } = server.address()

    const response = await axios.post(
      `http://127.0.0.1:${port}/lnbits`,
      { payment_hash: 'a'.repeat(64), amount: 21000 },
      { validateStatus: () => true },
    )

    expect(response.status).to.equal(200)
    expect(receivedBody).to.deep.equal({ payment_hash: 'a'.repeat(64), amount: 21000 })
  })
})
