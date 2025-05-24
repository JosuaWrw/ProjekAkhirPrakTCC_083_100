import mobils from "../model/mobilModel.js";

 export const getMobil = async (req, res) => {
    try {
        const response = await mobils.findAll();
        res.status(200).json(response)
    } catch (error) {
        console.log(error.message);
    }
 };

export const getMobilById = async (req, res) => {
    try {
        const response = await mobils.findOne({
            where:{
                id: req.params.id
            }
        });
        res.status(200).json(response)
    } catch (error) {
        console.log(error.message);
    }
}

export const createMobil = async (req, res) => {
    try {
        await mobils.create(req.body);
        res.status(201).json({msg: "Produk Created"})
    } catch (error) {
        
    }
}

export const updateMobil = async (req, res) => {
    try {
        await mobils.update(req.body, {
            where: {
                id: req.params.id
            }
        });
        res.status(200).json({msg: "Produk Updated"})
    } catch {
        console.log(error.message);
    }
}

export const deleteMobil = async (req, res) => {
    try {
        await mobils.destroy({
            where: {
                id: req.params.id
            }
        });
        res.status(200).json({msg: "Produk Deleted"})
    } catch {
        console.log(error.message);
    }
}