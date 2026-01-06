import nodemailer from 'nodemailer';

// Gmail SMTP configuration
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const FROM_NAME = 'Book-iT';

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  vendorName: string;
  serviceName: string;
  date: string;
  time: string;
  price: string;
  vendorAddress: string;
  vendorCity: string;
  vendorPhone?: string;
}

interface ReviewPromptData {
  customerName: string;
  customerEmail: string;
  vendorName: string;
  serviceName: string;
  vendorSlug: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured, skipping booking confirmation');
    return { success: false, error: 'Email not configured' };
  }

  const { customerName, customerEmail, vendorName, serviceName, date, time, price, vendorAddress, vendorCity, vendorPhone } = data;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `Booking Confirmed: ${serviceName} at ${vendorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi ${customerName},</p>
            <p style="font-size: 16px;">Your appointment has been confirmed. Here are the details:</p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h2 style="color: #7c3aed; margin-top: 0; font-size: 18px;">${serviceName}</h2>
              <p style="margin: 8px 0;"><strong>Business:</strong> ${vendorName}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
              <p style="margin: 8px 0;"><strong>Price:</strong> $${price}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
              <p style="margin: 8px 0;"><strong>Location:</strong><br>${vendorAddress}<br>${vendorCity}</p>
              ${vendorPhone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${vendorPhone}</p>` : ''}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View My Bookings</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Need to make changes? You can manage your booking from your dashboard.
            </p>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Book-iT - Your appointment booking marketplace
          </p>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendBookingCancellation(data: BookingEmailData & { cancelledBy: 'customer' | 'vendor'; reason?: string }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured, skipping cancellation email');
    return { success: false, error: 'Email not configured' };
  }

  const { customerName, customerEmail, vendorName, serviceName, date, time, cancelledBy, reason } = data;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `Booking Cancelled: ${serviceName} at ${vendorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ef4444; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Cancelled</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi ${customerName},</p>
            <p style="font-size: 16px;">Your appointment has been cancelled${cancelledBy === 'vendor' ? ' by the business' : ''}.</p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h2 style="color: #ef4444; margin-top: 0; font-size: 18px;">${serviceName}</h2>
              <p style="margin: 8px 0;"><strong>Business:</strong> ${vendorName}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
              ${reason ? `<p style="margin: 8px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Book Another Appointment</a>
            </div>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Book-iT - Your appointment booking marketplace
          </p>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send booking cancellation email:', error);
    return { success: false, error };
  }
}

export async function sendReviewPrompt(data: ReviewPromptData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured, skipping review prompt');
    return { success: false, error: 'Email not configured' };
  }

  const { customerName, customerEmail, vendorName, serviceName } = data;

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `How was your experience at ${vendorName}?`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Share Your Experience</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi ${customerName},</p>
            <p style="font-size: 16px;">We hope you enjoyed your <strong>${serviceName}</strong> at <strong>${vendorName}</strong>!</p>
            <p style="font-size: 16px;">Your feedback helps other customers make informed decisions and helps businesses improve their services.</p>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; margin: 0;">
                <span style="color: #fbbf24;">&#9733; &#9733; &#9733; &#9733; &#9733;</span>
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Leave a Review</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
              It only takes a minute!
            </p>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Book-iT - Your appointment booking marketplace
          </p>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send review prompt email:', error);
    return { success: false, error };
  }
}

export async function sendVendorNewBookingNotification(data: {
  vendorEmail: string;
  vendorName: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured, skipping vendor notification');
    return { success: false, error: 'Email not configured' };
  }

  const { vendorEmail, vendorName, customerName, serviceName, date, time } = data;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${process.env.GMAIL_USER}>`,
      to: vendorEmail,
      subject: `New Booking: ${serviceName} on ${formattedDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Booking!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi ${vendorName},</p>
            <p style="font-size: 16px;">You have a new booking!</p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h2 style="color: #10b981; margin-top: 0; font-size: 18px;">${serviceName}</h2>
              <p style="margin: 8px 0;"><strong>Customer:</strong> ${customerName}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vendor/bookings" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Booking</a>
            </div>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Book-iT - Your appointment booking marketplace
          </p>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send vendor notification email:', error);
    return { success: false, error };
  }
}
