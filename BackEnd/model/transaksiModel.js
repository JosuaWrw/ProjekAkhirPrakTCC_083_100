import { Sequelize } from "sequelize"
import db from "../config/database.js"
import User from"../model/UserModel.js"
import mobils from"../model/mobilModel.js"

const Transaksi = db.define('transaksi',{
    id_user: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    id_mobil: {
        type: Sequelize.INTEGER,
        references: {
            model: mobils,
            key: 'id'
        }
    },
    metode_pembayaran : Sequelize.STRING,
    tanggal_dipesan : {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
},{
    freezeTableName : true,
    timestamps: false,
});


Transaksi.belongsTo(User, { foreignKey: 'id_user' });
Transaksi.belongsTo(mobils, { foreignKey: 'id_mobil' });

export default Transaksi;

(async()=>{
    await db.sync()
})();