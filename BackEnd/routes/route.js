import express from 'express';
import { getMobil, 
        getMobilById, 
        createMobil, 
        updateMobil, 
        deleteMobil
} from '../controller/mobilController.js';

import { getTransaksi,
        createTransaksi,
        getTransaksiById,
        getTransaksiUser,
        deleteTransaksi,
        updateTransaksi
 } from '../controller/transaksiController.js';

import { getUsers,
        createUser,
        updateUser,
        deleteUser,
        getUserById,
        loginHandler,
        logout
} from '../controller/userController.js';

import { refreshToken } from "../controller/refreshToken.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

// User Routes
router.get('/token', refreshToken);
router.post('/login', loginHandler);
router.delete('/logout', logout);
router.post("/register", createUser);
router.get("/user", verifyToken, getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.put("/edit-user/:id", verifyToken, updateUser);
router.delete("/delete-user/:id", verifyToken, deleteUser);

// Mobil Routes
router.get('/mobil', getMobil);
router.get('/mobil/:id', getMobilById);
router.post('/tambahmobil', createMobil);
router.put('/updatemobil/:id', updateMobil);
router.delete('/deletemobil/:id', deleteMobil);

// Transaksi Routes
router.get('/transaksiuser/:id', verifyToken, getTransaksiUser);
router.post('/tambahtransaksi', verifyToken, createTransaksi);
router.get('/transaksi/:id', verifyToken, getTransaksiById);
router.get('/transaksi', verifyToken, getTransaksi);
router.delete('/deletetransaksi/:id', verifyToken, deleteTransaksi);
router.put('/updatetransaksi/:id', verifyToken, updateTransaksi);

export default router;