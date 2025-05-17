// functions/src/lib/emailService.ts
import * as functions from 'firebase-functions/v1'; // For accessing environment config

// You would typically install nodemailer and a transport for your email provider
// For example, for SendGrid:
// npm install nodemailer nodemailer-sendgrid-transport
// import * as nodemailer from 'nodemailer';
// import * as sgTransport from 'nodemailer-sendgrid-transport';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Optional plain text version
}

/**
 * Sends an email.
 * This is a placeholder and will just log the email details for now.
 * Replace with actual email sending logic (e.g., using SendGrid, Nodemailer).
 */
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  console.log("--- Attempting to Send Email ---");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  
  // ---NODEMAILER + SENDGRID EXAMPLE (COMMENTED OUT) ---
  /*
  try {
    // Ensure you have set these in your Firebase environment configuration:
    // firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY"
    // firebase functions:config:set sendgrid.senderemail="your-verified-sender@example.com"
    const sendgridApiKey = functions.config().sendgrid?.apikey;
    const senderEmail = functions.config().sendgrid?.senderemail;

    if (!sendgridApiKey || !senderEmail) {
      console.error("SendGrid API key or sender email not configured in Firebase environment.");
      return { success: false, error: "Email service not configured." };
    }

    const mailTransport = nodemailer.createTransport(sgTransport({
      auth: {
        api_key: sendgridApiKey
      }
    }));

    const mailOptions = {
      from: senderEmail, // Must be a verified sender in SendGrid
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await mailTransport.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error: any) {
    console.error("Error sending email via SendGrid:", error);
    return { success: false, error: error.message || "Failed to send email." };
  }
  */

  // --- CURRENT PLACEHOLDER LOGIC ---
  console.log("--- Using Placeholder Email Logging ---");
  console.log("HTML Body (first 200 chars):");
  console.log(options.html.substring(0, 200) + (options.html.length > 200 ? "..." : ""));
  if (options.text) {
    console.log("Text Body (first 200 chars):");
    console.log(options.text.substring(0, 200) + (options.text.length > 200 ? "..." : ""));
  }
  console.log("--- Email Sending Complete (Placeholder) ---");
  
  // Simulate a successful email send for placeholder
  return Promise.resolve({ success: true, messageId: `mock-${Date.now()}` });
}; 