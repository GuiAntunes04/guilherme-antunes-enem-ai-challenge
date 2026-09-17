import { createApp } from './app.js'
import { env, validateProductionEnv } from './config/env.js'

validateProductionEnv()

const app = createApp()

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`)
})
