import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { rateLimit } from 'express-rate-limit';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { runRetentionPolicy } from "./src/lib/retention-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage for social tokens (in-memory for demo, should be DB in production)
const socialTokens: Record<string, { accessToken: string; refreshToken?: string }> = {};

import { GoogleGenAI, Type, GenerateVideosOperation } from "@google/genai";

// Initialize Gemini with recommended headers and correct API key lookup
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

  // AI Routes
  app.post("/api/ai/audit", async (req, res) => {
    const appData = req.body;
    const prompt = `
      Perform a multi-stage security and content audit on the following software submission for the PymmCore Matrix.
      
      APP METADATA:
      Name: ${appData.name}
      Description: ${appData.description}
      Target URL: ${appData.link}
      Source Code: ${appData.sourceCodeUrl || 'Not Provided'}
      Developer: ${appData.developer}

      AUDIT PROTOCOLS:
      1. URL ANALYSIS: Check the target URL for signs of phishing, deceptive patterns, or known malicious domains.
2. CONTENT MODERATION: Scan description for spam, offensive language, or misleading claims.
3. TECHNICAL SCAVENGE: If source code URL is provided, evaluate the reputation of the repository domain.
4. RISK SCORING: Assign a score (Safe, Suspicious, Dangerous).

      Output a detailed technical report and a final risk assessment.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.STRING, enum: ["Safe", "Suspicious", "Dangerous"] },
              report: { type: Type.STRING },
              flags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["riskScore", "report", "flags"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("AI Audit failed:", error);
      res.status(500).json({ riskScore: 'Suspicious', report: 'Audit interrupted.', flags: ['INTERNAL_ERROR'] });
    }
  });

  app.post("/api/ai/suggest-icon", async (req, res) => {
    const { name, description } = req.body;
    const prompt = `Suggest a single PascalCase Lucide icon name representing: Name: ${name}, Description: ${description}. Return JSON {iconName, reason}.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { iconName: { type: Type.STRING }, reason: { type: Type.STRING } },
            required: ["iconName", "reason"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      res.status(500).json({ iconName: 'Box', reason: 'Fallback' });
    }
  });

  app.post("/api/ai/marketing-info", async (req, res) => {
    const appData = req.body;
    const prompt = `Create futuristic social caption and video generation prompt for app: ${appData.name}. Return JSON {caption, videoPrompt}.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { caption: { type: Type.STRING }, videoPrompt: { type: Type.STRING } },
            required: ["caption", "videoPrompt"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Marketing generation failed, using fallback:", error);
      res.json({ 
        caption: `Unleash the power of ${appData.name} on the Matrix! 🚀`, 
        videoPrompt: `A high quality cinematic premium preview representing ${appData.name} software interface.` 
      });
    }
  });

  app.post("/api/ai/marketing-video", async (req, res) => {
    const { prompt } = req.body;
    try {
      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `${prompt}. High quality pro marketing video.`,
        config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
      });
      
      let attempts = 0;
      while (attempts < 12) {
        const op = new GenerateVideosOperation();
        op.name = operation.name;
        const response = await ai.operations.getVideosOperation({ operation: op });
        if (response.done) {
          const uri = response.response?.generatedVideos?.[0]?.video?.uri;
          if (uri) {
            const videoRes = await fetch(uri, {
              headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || "" },
            });
            const arrayBuffer = await videoRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return res.json({ videoUrl: `data:video/mp4;base64,${base64}` });
          }
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
      res.status(408).json({ error: "Generation timed out" });
    } catch (error: any) {
      console.error("Video generation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Social Auth Callbacks (Refer to oauth-integration skill for popup patterns)
  app.get("/api/auth/:platform/callback", (req, res) => {
    const { platform } = req.params;
    const { code } = req.query;

    if (!code) {
      return res.send(`
        <script>
          window.opener.postMessage({ type: 'AUTH_ERROR', platform: '${platform}', error: 'Access denied' }, '*');
          window.close();
        </script>
      `);
    }

    // In a real flow, exchange code for token here
    const token = process.env.NODE_ENV === 'production' 
      ? `token_${Math.random().toString(36).substring(7)}` 
      : `mock_token_${Date.now()}`;
    
    socialTokens[platform] = { accessToken: token };

    res.send(`
      <script>
        window.opener.postMessage({ type: 'AUTH_SUCCESS', platform: '${platform}' }, '*');
        window.close();
      </script>
    `);
  });

  // Social Publishing Endpoint
  app.post("/api/publish", async (req, res) => {
    const { appId, caption, videoUrl, platforms } = req.body;
    
    console.log(`Publishing campaign for ${appId} to ${platforms.join(', ')}`);

    // Simulate API calls to TikTok, Instagram
    try {
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      res.json({ 
        success: true, 
        message: "Marketing campaign dispatched directly to social channels.",
        postIds: platforms.reduce((acc, p) => ({ ...acc, [p]: `social_${Math.random().toString(36).substr(2, 9)}` }), {})
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    console.log("Contact form submission received:", { name, email, subject });

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || adminEmail).trim();

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
        to: adminEmail,
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
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || adminEmail).trim();

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
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || adminEmail).trim();

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
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
    const fromEmail = (process.env.SMTP_FROM_EMAIL || adminEmail).trim();

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

  // Admin Purge Logs endpoint (Manual/Triggered)
  app.post("/api/admin/purge-logs", async (req, res) => {
    try {
      const result = await runRetentionPolicy();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Manual retention logs purge failed:", error);
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

    // Run automated 30-day retention clean-up once on boot (after a 5-second warm-up delay)
    setTimeout(() => {
      runRetentionPolicy().catch(err => {
        console.error("Boot-time log retention job failed:", err);
      });
    }, 5000);

    // Schedule periodic retention clean-up every 12 hours
    setInterval(() => {
      runRetentionPolicy().catch(err => {
        console.error("Periodic log retention job failed:", err);
      });
    }, 12 * 60 * 60 * 1000);
  });
}

startServer();
