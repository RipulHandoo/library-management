const mysql = require("mysql");

const connection = mysql.createConnection({
    host:'localhost',
    password:'casper@21',
    user:'root',
    database:'libProject'
});

module.exports = connection;