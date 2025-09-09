import express from 'express'
import userRoute from './Controllers/userController.js';
import authRoute from './Controllers/authController.js';
const app = express();


import http from 'http';
const server = http.createServer(app);
app.use(express.json());

app.use('/users', userRoute);
app.use('/auth', authRoute);

const PORT = process.env.PORT || 4000;
const HOST = 'localhost';

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`Your IP address is: ${HOST}`);
});