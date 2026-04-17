module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './data.db'
    },
    useNullAsDefault: true
  }
};