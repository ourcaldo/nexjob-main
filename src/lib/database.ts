import { neon } from '@neondatabase/serverless'

// This file is server-side only
let sql: any = null

if (typeof window === 'undefined') {
  const PGHOST = process.env.PGHOST
  const PGDATABASE = process.env.PGDATABASE  
  const PGUSER = process.env.PGUSER
  const PGPASSWORD = process.env.PGPASSWORD
  const PGSSLMODE = process.env.PGSSLMODE || 'require'

  if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD) {
    throw new Error(
      'Missing database environment variables. Please set PGHOST, PGDATABASE, PGUSER, and PGPASSWORD in your .env file.'
    )
  }

  const connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=${PGSSLMODE}`

  sql = neon(connectionString)
}

export { sql }
