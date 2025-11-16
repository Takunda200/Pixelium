const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug logging
console.log('🚀 Starting Pixelium Solutions server...');
console.log('📧 Email User:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
console.log('🏢 Business Email:', process.env.BUSINESS_EMAIL || 'Using EMAIL_USER');
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Port:', PORT);

// Middleware
app.use(cors({
  origin: ['https://pixelium-website.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Email transporter configuration with better error handling
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not configured');
    return null;
  }

  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify transporter configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter failed:', error);
      } else {
        console.log('✅ Email transporter ready');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

// Health check endpoint - test this first!
app.get('/api/health', (req, res) => {
  const health = {
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    nodeVersion: process.version,
    platform: process.platform
  };
  console.log('🏥 Health check:', health);
  res.json(health);
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
      subject: 'Test Email from Pixelium Solutions',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #0a58ca;">Test Email Successful! 🎉</h2>
          <p>Your Pixelium Solutions email system is working correctly.</p>
          <p><strong>Server Time:</strong> ${new Date().toString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
      `
    };

    await transporter.sendMail(testMailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.'
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email: ' + error.message
    });
  }
});

// Quote form endpoint
app.post('/api/quote', async (req, res) => {
  console.log('📨 Quote form received:', req.body);
  
  try {
    const { name, email, company, service, message } = req.body;

    // Basic validation
    if (!name || !email || !service || !message) {
      console.log('❌ Quote form validation failed');
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service temporarily unavailable. Please try again later.'
      });
    }
    
    // Email to business
    const businessMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
      subject: `New Quote Request - ${service}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a58ca;">New Quote Request</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent from Pixelium Solutions Website - ${new Date().toString()}
          </p>
        </div>
      `
    };

    // Confirmation email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for your quote request - Pixelium Solutions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a58ca;">Thank you for contacting Pixelium Solutions!</h2>
          <p>Dear ${name},</p>
          <p>We've received your quote request for <strong>${service}</strong> and will get back to you within 24 hours.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
          <hr>
          <p><strong>Pixelium Solutions</strong><br>
          Email: hello@pixelium.com<br>
          Phone: +1 (555) 123-4567</p>
          <p style="color: #666; font-size: 12px;">
            This is an automated confirmation. ${new Date().toString()}
          </p>
        </div>
      `
    };

    // Send both emails
    console.log('📤 Sending quote emails...');
    await transporter.sendMail(businessMailOptions);
    console.log('✅ Business email sent');
    
    await transporter.sendMail(userMailOptions);
    console.log('✅ User confirmation email sent');

    res.json({ 
      success: true, 
      message: 'Quote request sent successfully! We will contact you soon.' 
    });
  } catch (error) {
    console.error('❌ Quote email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send quote request. Please try again later.' 
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  console.log('📧 Contact form received:', req.body);
  
  try {
    const { name, email, company, service, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      console.log('❌ Contact form validation failed');
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service temporarily unavailable. Please try again later.'
      });
    }
    
    const businessMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
      subject: `New Contact Form - ${service || 'General Inquiry'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a58ca;">New Contact Form Submission</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Service Interest:</strong> ${service || 'Not specified'}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent from Pixelium Solutions Website - ${new Date().toString()}
          </p>
        </div>
      `
    };

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Pixelium Solutions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a58ca;">Thank you for reaching out!</h2>
          <p>Dear ${name},</p>
          <p>We've received your message and our team will get back to you within one business day.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your inquiry:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
          <hr>
          <p><strong>Pixelium Solutions</strong><br>
          Email: hello@pixelium.com<br>
          Phone: +1 (555) 123-4567<br>
          Address: 123 Tech Avenue, Suite 400, Metropolis, NY 10001</p>
          <p style="color: #666; font-size: 12px;">
            This is an automated confirmation. ${new Date().toString()}
          </p>
        </div>
      `
    };

    console.log('📤 Sending contact emails...');
    await transporter.sendMail(businessMailOptions);
    console.log('✅ Business contact email sent');
    
    await transporter.sendMail(userMailOptions);
    console.log('✅ User contact confirmation email sent');

    res.json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('❌ Contact email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

// Serve the main HTML file for all routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Pixelium Solutions server running on port ${PORT}`);
  console.log(`🌐 Access your site: https://pixelium-website.onrender.com`);
  console.log(`🔧 Health check: https://pixelium-website.onrender.com/api/health`);
  console.log(`📧 Test email: https://pixelium-website.onrender.com/api/test-email`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});
