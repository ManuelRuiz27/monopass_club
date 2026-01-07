import { seedDatabase } from '../src/lib/seeder'

if (require.main === module) {
  seedDatabase()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
}