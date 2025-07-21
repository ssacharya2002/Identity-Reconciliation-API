import express from 'express';
import cors from 'cors';
import identifyRoutes from './routes/identify';

import swaggerSpec from './swagger/swaggerSpec';
import swaggerUi from 'swagger-ui-express';


import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to the API!");
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', identifyRoutes);

export default app;
