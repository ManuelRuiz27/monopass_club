import { describe, expect, it } from 'vitest'
import { buildServer } from './server'

describe('core-api server', () => {
  it('exposes health endpoint', async () => {
    const app = await buildServer()
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok', service: 'core-api' })

    await app.close()
  })
})