import { Sequelize } from "sequelize";
import db from "../config/database.js";

const User = db.define(
  "user",
  {
    nama: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    no_telepon: Sequelize.STRING,
    alamat: Sequelize.STRING,
    role: Sequelize.STRING,
    refresh_token: Sequelize.TEXT
  },{
    freezeTableName : true,
    timestamps: false
});

db.sync().then(() => console.log("Database synced"));

export default User;