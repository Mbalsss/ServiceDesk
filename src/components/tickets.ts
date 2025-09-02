import express from 'express';
import nodemailer from 'nodemailer';
const router = express.Router();

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
}

let tickets: Ticket[] = [];

router.get('/', (_, res) => res.json(tickets));

router.post('/', async (req, res) => {
  const { title, description } = req.body;
  const newTicket: Ticket = { id: Date.now().toString(), title, description, status: 'open' };
  tickets.push(newTicket);

  // Send notification email
  const transporter = nodemailer.createTransport({
    service: 'gmail', // you can use your SMTP provider
    auth: {
      user: process.env.monicandlovu18@gmail.com,
      pass: process.env.R1chfield#1994
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'support@hapo.co.za',
    subject: `New Ticket: ${title}`,
    text: description
  });

  res.status(201).json(newTicket);
});

export default router;
