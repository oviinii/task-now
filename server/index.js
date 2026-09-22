// Entrypoint local: node server/index.js
import { createApp } from './app.js'

const PORT = process.env.PORT || 3001
createApp().listen(PORT, () => console.log(`⚔️  QuestLog API em http://localhost:${PORT}`))
