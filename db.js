// connexion à la base de données SQLite via Knex
const knex = require('knex');
const config = require('./knexfile').development;

module.exports = knex(config);
