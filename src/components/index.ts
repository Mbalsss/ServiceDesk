import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ticketRoutes from './routes/tickets';
import techRoutes from './routes/technicians';
import workflowRoutes from './routes/workflows';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/tickets', ticketRoutes);
app.use('/technicians', techRoutes);
app.use('/workflows', workflowRoutes);

app.get('/', (_, res) => res.send('Service Desk Backend Running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

