import { Sequelize } from "sequelize";

const db = new Sequelize('dealer_db','root','',{
    host: 'localhost',
    dialect: 'mysql'
});

export default db;