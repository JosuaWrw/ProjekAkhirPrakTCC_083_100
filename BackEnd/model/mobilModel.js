import { Sequelize } from "sequelize";
import db from "../config/database.js";

const mobils = db.define("mobil",{
    nama: Sequelize.STRING,
    merek: Sequelize.STRING,
    tahun_produksi: Sequelize.STRING,
    harga: Sequelize.STRING,
  },{
    freezeTableName : true,
    timestamps: false
});

export default mobils;

(async()=>{
    await db.sync();
})();