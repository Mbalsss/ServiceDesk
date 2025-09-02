import express from "express";
import nodemailer from "nodemailer";
import axios from "axios";

const app = express();
app.use(express.json());

// =======================================
// CONFIGURATION
// =======================================

// Outlook / Gmail SMTP for email
const transporter = nodemailer.createTransport({
  service: "Outlook", // or "Gmail"
  auth: {
    user: "support@hapogroup.co.za",   // 🔹 Replace with your email
    pass: "R1chfield#2018"         // 🔹 Replace with App Password (not normal password)
  }
});

// Microsoft Teams Webhook URL
const TEAMS_WEBHOOK_URL = "https://https://outlook.office.com/mail/"; // 🔹 Replace with your webhook URL

// In-memory tickets (for demo)
let tickets = [];

// =======================================
// API ENDPOINT
// =======================================
app.post("/submit-ticket", async (req, res) => {
  const { name, email, issue } = req.body;

  if (!name || !email || !issue) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  // Save ticket
  const newTicket = { id: Date.now(), name, email, issue };
  tickets.push(newTicket);

  try {
    // ---------------------
    // Send Email
    // ---------------------
    await transporter.sendMail({
      from: "your_email@outlook.com",
      to: "support@hapogroup.coza", // 🔹 Technicians/support email
      subject: `🎫 New Ticket from ${name}`,
      text: `A new ticket has been submitted:\n\nName: ${name}\nEmail: ${email}\nIssue: ${issue}`
    });

    // ---------------------
    // Send Teams Notification
    // ---------------------
    await axios.post(TEAMS_WEBHOOK_URL, {
      text: `🎫 **New Ticket Submitted**\n\n👤 From: ${name}\n📧 Email: ${email}\n📝 Issue: ${issue}`
    });

    res.json({ success: true, message: "Ticket submitted. Email + Teams notified!" });

  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ success: false, message: "Error sending notifications" });
  }
});

// =======================================
// START SERVER
// =======================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
