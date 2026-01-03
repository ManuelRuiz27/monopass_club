import { FastifyInstance } from 'fastify'
import { registerHealthRoutes } from './health'
import { registerAuthRoutes } from '../../modules/auth/routes'
import { registerClubRoutes } from '../../modules/clubs/routes'
import { registerEventRoutes } from '../../modules/events/routes'
import { registerRpRoutes } from '../../modules/rps/routes'
import { registerScannerRoutes } from '../../modules/scanners/routes'
import { registerSettingsRoutes } from '../../modules/settings/routes'
import { registerRpPortalRoutes } from '../../modules/rp-portal/routes'
import { registerTicketRoutes } from '../../modules/tickets/routes'
import { registerCutRoutes } from '../../modules/cuts/routes'
import { registerRpGroupRoutes } from '../../modules/rp-groups/routes'

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app)
  await registerAuthRoutes(app)
  await registerClubRoutes(app)
  await registerEventRoutes(app)
  await registerRpRoutes(app)
  await registerScannerRoutes(app)
  await registerSettingsRoutes(app)
  await registerRpPortalRoutes(app)
  await registerTicketRoutes(app)
  await registerCutRoutes(app)
  await registerRpGroupRoutes(app)
}
