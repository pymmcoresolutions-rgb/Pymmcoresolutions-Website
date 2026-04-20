import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { rateLimit } from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting (essential in AI Studio/Cloud Run environments)
  app.set('trust proxy', 1);

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });

  const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5, // Limit each IP to 5 requests per window for sensitive endpoints
    message: { error: 'Too many attempts, please try again in 15 minutes.' }
  });

  app.use(express.json());
  app.use('/api/', apiLimiter);
  app.use('/api/contact', sensitiveLimiter);
  app.use('/api/admin/test-smtp', sensitiveLimiter);

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

  // Admin Broadcast endpoint
  app.post("/api/admin/broadcast", async (req, res) => {
    const { emails, subject, content } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: "Recipient list is required." });
    }

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
        error: "SMTP not configured. Broadcast aborted." 
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

      // For high volume, we send in batches to avoid spam filters
      const batchSize = 25;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        await Promise.all(batch.map(email => 
          transporter.sendMail({
            from: `"PymmCore Executive" <${fromEmail}>`,
            to: email,
            subject: subject,
            html: `
              <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
                <div style="background: #0f172a; padding: 40px text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #2dd4bf; margin: 0; font-size: 24px; letter-spacing: 2px;">PYMMCORE BROADCAST</h1>
                </div>
                <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                  <div style="margin-bottom: 30px;">
                    ${content.replace(/\n/g, '<br>')}
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  <div style="font-size: 10px; color: #64748b; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                    <p>© 2026 PymmCore Solutions • Infrastructure Protocol 5.0</p>
                    <p>You received this mission briefing because you are registered in our secure infrastructure protocols.</p>
                    <p><a href="#" style="color: #2dd4bf; text-decoration: none;">Preference Center</a> | <a href="#" style="color: #2dd4bf; text-decoration: none;">Unsubscribe</a></p>
                  </div>
                </div>
              </div>
            `
          })
        ));

        // Small delay between batches to respect rate limits
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      res.json({ success: true, message: "Broadcast dispatched successfully." });
    } catch (error: any) {
      console.error("Broadcast failed:", error);
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
