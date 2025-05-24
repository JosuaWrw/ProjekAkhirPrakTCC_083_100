import Transaksi from "../model/transaksiModel.js";
import User from "../model/UserModel.js";
import mobils from "../model/mobilModel.js";

export const getTransaksiUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "ID tidak boleh kosong" });
        }

        const response = await Transaksi.findAll({
            where: { id_user: id },
            include: [
                {
                    model: User,
                    attributes: ['id', 'nama', 'alamat', 'no_telepon']
                },
                {
                    model: mobils,
                    attributes: ['id', 'nama', 'harga']
                }
            ]
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data transaksi" });
    }
};

export const createTransaksi = async (req, res) => {
    try {
        await Transaksi.create(req.body);
        res.status(201).json({msg: "Transaksi Created"})
    } catch (error) {
        console.log(error.message);
    }
}

export const getTransaksiById = async(req, res)=>{
    try{
        const response = await Transaksi.findAll({
            where:{
                id:req.params.id
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'nama', 'alamat', 'no_telepon']
                },
                {
                    model: mobils,
                    attributes: ['id', 'nama', 'harga']
                }
            ] 
        });
        res.status(200).json(response);
    } catch(error){
        console.log(error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data transaksi" });
    }
    
}

export async function getTransaksi(req, res) {
  try {
    const response = await Transaksi.findAll();
    res.status(200).json(response);
  } catch (error) {
    console.log(error.message);
  }
}

export const deleteTransaksi = async(req, res) =>{
    try{
        await Transaksi.destroy({
            where:{
                id: req.params.id
            }
        });
        res.status(200).json({msg:"Transaksi Deleted"});
    } catch(error){
        console.log(error.message);
    }
}

export const updateTransaksi = async(req, res)=>{
    try{
        await Transaksi.update(req.body,{
            where:{
                id: req.params.id
            }
        });
        res.status(200).json({msg:"Transaksi Updated"});
    } catch(error){
        console.log(error.message);
    }
}