import express from 'express'
import http from 'http';
import cookieParser from 'cookie-parser'
import userRoute from './Controllers/userController.js';
import authRoute from './Controllers/authController.js';
import addressRoute from './Controllers/addressCont.js';
import courierLoc from "./Controllers/courierLocCont.js";
import cartRoutes from './Controllers/cartController.js';
import orderRoutes from './Controllers/orderController.js';
import { PORT, HOST } from '../utils/serverConf.js';

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser())

app.use('/users', userRoute);
app.use('/auth', authRoute);
app.use('/address', addressRoute);
app.use('/courier', courierLoc);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);

// CORS middleware

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`Your IP address is: ${HOST}`);
});