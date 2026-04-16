import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    console.log("Contact form submission received:", { name, email, subject });

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || "pymmcoresolutions@gmail.com").trim();

    // Helper to check for missing or placeholder values
    const isInvalid = (val: string | undefined) => 
      !val || val.trim() === "" || val.includes("YOUR_") || val.includes("MY_") || val.includes("<") || val === "undefined";

    if (isInvalid(smtpHost) || isInvalid(smtpUser) || isInvalid(smtpPass)) {
      console.warn("--- SMTP CONFIGURATION MISSING ---");
      console.warn("Host:", smtpHost);
      console.warn("User:", smtpUser);
      console.warn("Pass:", smtpPass ? "****" : "MISSING");
      console.warn("Email delivery skipped. Message saved to database only.");
      
      return res.json({ 
        success: true, 
        message: "Message received and saved to database.",
        warning: "SMTP credentials not configured in Secrets panel. Email delivery skipped.",
        emailStatus: "skipped"
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transporter.sendMail({
        from: `"PymmCore Storefront" <${fromEmail}>`,
        to: "pymmcoresolutions@gmail.com",
        replyTo: email,
        subject: `[Contact Form] ${subject || "New Inquiry"}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || "N/A"}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
        `,
      });

      res.json({ 
        success: true, 
        message: "Your message has been received and saved.",
        emailStatus: "sent"
      });
    } catch (error: any) {
      // Improved logging to ensure full error is visible
      console.error("--- SMTP ERROR START ---");
      console.error("Message:", error.message);
      console.error("Code:", error.code);
      console.error("Response:", error.response);
      console.error("Full Error Object:", JSON.stringify(error, null, 2));
      console.error("--- SMTP ERROR END ---");

      res.json({ 
        success: true, 
        message: "Message received and saved to database.",
        warning: "Email notification failed. Please check SMTP settings in the admin panel.",
        emailStatus: "failed",
        debug: error.message
      });
    }
  });

  // Admin SMTP Test endpoint
  app.post("/api/admin/test-smtp", async (req, res) => {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || "pymmcoresolutions@gmail.com").trim();

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
      });

      // Verify connection configuration
      await transporter.verify();

      // Send a test email
      await transporter.sendMail({
        from: `"PymmCore Admin" <${fromEmail}>`,
        to: fromEmail,
        subject: "SMTP Connection Test",
        text: "This is a test email to verify your SMTP configuration for PymmCore Storefront.",
      });

      res.json({ success: true, message: "SMTP Connection verified and test email sent!" });
    } catch (error: any) {
      console.error("SMTP Test Failure:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: error.code,
        response: error.response
      });
    }
  });

  // Admin Reply endpoint
  app.post("/api/admin/reply", async (req, res) => {
    const { to, subject, message, originalMessage } = req.body;
    
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || "pymmcoresolutions@gmail.com").trim();

    const isInvalid = (val: string | undefined) => 
      !val || val.trim() === "" || val.includes("YOUR_") || val.includes("MY_") || val.includes("<") || val === "undefined";

    if (isInvalid(smtpHost) || isInvalid(smtpUser) || isInvalid(smtpPass)) {
      return res.status(400).json({ 
        success: false, 
        error: "SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in Secrets." 
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"PymmCore Support" <${fromEmail}>`,
        to,
        subject: `Re: ${subject}`,
        text: `${message}\n\n---\nOriginal Message:\n${originalMessage}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="margin-bottom: 30px; line-height: 1.6; color: #333;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 12px;">
              <p><strong>Original Message:</strong></p>
              <blockquote style="border-left: 3px solid #eee; padding-left: 15px; margin: 0; font-style: italic;">
                ${originalMessage.replace(/\n/g, '<br>')}
              </blockquote>
            </div>
          </div>
        `,
      });

      res.json({ success: true, message: "Reply sent successfully!" });
    } catch (error: any) {
      console.error("Reply failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PymmCore Server running on http://localhost:${PORT}`);
  });
}

startServer();
