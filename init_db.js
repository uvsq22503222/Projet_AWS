const db = require('./db');

async function init() {
  const exists = await db.schema.hasTable('users');

  if (!exists) {
    await db.schema.createTable('users', table => {
      table.increments('id').primary();
      table.string('username').unique();
      table.string('password');
      table.integer('score').defaultTo(0);
    });

    console.log("Table users créée avec succès");
  }
}

init();