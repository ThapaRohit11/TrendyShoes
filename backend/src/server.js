import { app } from './app.js'
import { config } from './config.js'
import { connectDatabase } from './database.js'

try {
  await connectDatabase()
  app.listen(config.port, () => console.log(`TrendyShoes API running on http://localhost:${config.port}`))
} catch (error) {
  console.error('Failed to start server:', error.message)
  process.exit(1)
}