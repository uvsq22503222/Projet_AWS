const db = require('./db');

// créer la table users si elle n'existe pas
async function init() {
    const exists = await db.schema.hasTable('users');

    if (!exists) {
        await db.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('username').unique();
            table.string('password');
            table.integer('score').defaultTo(0);   // victoires
            table.integer('losses').defaultTo(0);  // défaites
        });

        console.log("Table users créée avec succès");
    }
}

init();
