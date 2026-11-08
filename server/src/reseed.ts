import { initSchema } from './db.js'
import { ensureUsers, seedDemoData } from './seed.js'

initSchema()
ensureUsers()
seedDemoData(true)
console.log('Demo data reseeded')
