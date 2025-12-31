import { describe, expect, it } from 'vitest'
import { buildServer } from './server'

describe('scanner-service', () => {
  it('responds to healthcheck', async () => {
    const app = await buildServer()
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body).toHaveProperty('status', 'ok')
    expect(body).toHaveProperty('uptime')
    expect(body).toHaveProperty('timestamp')

    await app.close()
  })
})