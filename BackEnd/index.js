import express from 'express';
import cors from 'cors';
import route from './routes/route.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(cookieParser());
app.use(cors({ credentials: true, origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'https://fe-projek-dot-alert-parsec-450813-a1.et.r.appspot.com'] }));
app.use(express.json());
app.use(route);

app.listen(3000, ()=> console.log("Server Telah Berjalan"))