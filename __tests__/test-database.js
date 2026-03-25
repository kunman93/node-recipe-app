const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

let currentDb = null

async function getTestDbConnection() {
	if (!currentDb) {
		throw new Error('Test database not initialized. Call initializeTestDb() before using getTestDbConnection().')
	}
	return currentDb
}

async function initializeTestDb() {
	currentDb = await open({
		filename: ':memory:',
		driver: sqlite3.Database,
	})
	await createTables(currentDb)
	return currentDb
}

async function createTables(db) {
	// Create the 'recipes' table to store recipe information
	await db.exec(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    ingredients TEXT,
    method TEXT
  )`)
}

module.exports = { getTestDbConnection, initializeTestDb }
