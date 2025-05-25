import User from "../model/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//Get All User

async function getUsers(req, res) {
  try {
    const response = await User.findAll();
    res.status(200).json(response);
  } catch (error) {
    console.log(error.message);
  }
}

//Get User By Id
async function getUserById(req, res) {
  try {
    const response = await User.findOne({ where: { id: req.params.id } });
    res.status(200).json(response);
  } catch (error) {
    console.log(error.message);
  }
}

//Register User
async function createUser(req, res) {
  try{
    const { nama, email, password, no_telepon, alamat, role } = req.body;
    const encryptPassword = await bcrypt.hash(password, 5);
    await User.create({
        nama: nama,
        email: email,
        password: encryptPassword,
        no_telepon: no_telepon,
        alamat: alamat,
        role: role,
    });
    res.status(201).json({ status: "Success", msg: "Register Berhasil" });
    } catch(error){
    console.log(error.message);
    }
}

//Update User
async function updateUser(req, res) {
  try{
    const { nama, email, password, no_telepon, alamat } = req.body;
    let updatedData = {
      nama, email, password, no_telepon, alamat, role
    }; 

    if (password) {
        const encryptPassword = await bcrypt.hash(password, 5);
        updatedData.password = encryptPassword;
    }

    const result = await User.update(updatedData, {
        where: {
            id: req.params.id
        }
    });

    // Periksa apakah ada baris yang terpengaruh (diupdate)
    if (result[0] === 0) {
        return res.status(404).json({
            status: 'failed',
            message: 'User tidak ditemukan atau tidak ada data yang berubah',
            updatedData: updatedData,
            result
        });
    }


    
    res.status(200).json({msg:"User Updated"});
  } catch(error){
    console.log(error.message);
  }
}

//Delete User
async function deleteUser(req, res) {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.status(201).json({ msg: "User Deleted" });
  } catch (error) {
    console.log(error.message);
  }
}

//Login User
async function loginHandler(req, res){
  try{
      const{email, password} = req.body;
      const user = await User.findOne({
          where : {
              email: email
          }
      });

      if(user){
        const userPlain = user.toJSON();
        const { password: _, refresh_token: __, ...safeUserData } = userPlain;


          const decryptPassword = await bcrypt.compare(password, user.password);
          if(decryptPassword){
              const accessToken = jwt.sign(safeUserData, process.env.ACCESS_TOKEN_SECRET, {
                  expiresIn : '1h' 
              });
              const refreshToken = jwt.sign(safeUserData, process.env.REFRESH_TOKEN_SECRET, {
                  expiresIn : '1d' 
              });
              await User.update({refresh_token:refreshToken},{
                  where:{
                      id:user.id
                  }
              });
              console.log("Mengirim cookie refreshToken:", refreshToken);
              res.cookie('refreshToken', refreshToken,{
                  httpOnly : true, //ngatur cross-site scripting, untuk penggunaan asli aktifkan karena bisa nyegah serangan fetch data dari website "document.cookies"
                  sameSite : 'none',  //ini ngatur domain yg request misal kalo strict cuman bisa akseske link dari dan menuju domain yg sama, lax itu bisa dari domain lain tapi cuman bisa get
                  secure : true, //ini ngatur apakah cookies bisa diakses dari https atau tidak, true itu hanya bisa diakses dari https
                  maxAge  : 24*60*60*1000,
              });
              res.status(200).json({
                  status: "Succes",
                  message: "Login Berhasil",
                  safeUserData,
                  accessToken 
              });
          }
          else{
              res.status(400).json({
                  status: "Failed",
                  message: "Paassword atau email salah",
                
              });
          }
      } else{
          res.status(400).json({
              status: "Failed",
              message: "Paassword atau email salah",
          });
      }
  } catch(error){
      res.status(error.statusCode || 500).json({
          status: "error",
          message: error.message
      })
  }
}

async function logout(req,res){
  const refreshToken = req.cookies.refreshToken; //ngecek refresh token sama gak kayak di database
  if(!refreshToken) return res.sendStatus(204);
  const user = await User.findOne({
      where:{
          refresh_token:refreshToken
      }
  });
  if(!user.refresh_token) return res.sendStatus(204);
  const userId = user.id;
  await User.update({refresh_token:null},{
      where:{
          id:userId
      }
  });
  res.clearCookie('refreshToken'); //ngehapus cookies yg tersimpan
  return res.sendStatus(200);
}

export { getUsers, getUserById, createUser, updateUser, deleteUser,loginHandler, logout};


