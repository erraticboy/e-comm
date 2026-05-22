import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

// Get nodemailer transport
const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Generate Ethereal testing account as fallback
    try {
      console.log("⚡ [MAIL] CREATING ETHEREAL SMTP TEST ACCOUNT...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`⚡ [MAIL] ETHEREAL ACCOUNT CREATED. USERNAME: ${testAccount.user}`);
    } catch (err) {
      console.warn("⚠️ [MAIL] ETHEREAL ACCOUNT CREATION FAILED. RUNNING IN TERMINAL LOG DEV MODE.");
      transporter = null;
    }
  }

  return transporter;
};

// Branded CSS Header and Footer Styles
const wrapperStyle = `
  background-color: #050505;
  color: #f5f5f5;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 40px 20px;
  text-align: left;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #0c0c14;
  border: 1px solid rgba(0, 245, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 245, 255, 0.05);
`;

const logoStyle = `
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  font-weight: 900;
  text-transform: uppercase;
  color: #00F5FF;
  border-bottom: 2px solid #8B5CF6;
  padding-bottom: 10px;
  margin-bottom: 30px;
  letter-spacing: 0.15em;
`;

export const sendOtpEmail = async (email: string, otp: string) => {
  try {
    const mailTransporter = await getTransporter();
    const html = `
      <div style="${wrapperStyle}">
        <div style="${containerStyle}">
          <div style="${logoStyle}">CYBERNETIX GRID</div>
          <h2 style="color: #ffffff; font-size: 20px;">SECURITY CLEARANCE PROTOCOL</h2>
          <p style="color: #a0aec0; font-size: 14px; line-height: 1.6;">
            A login or signup vector has requested access to your cortical nodes. Verify your terminal coordinates using the OTP code below:
          </p>
          <div style="background-color: #1a1a2e; border: 1px solid #8B5CF6; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #00F5FF; letter-spacing: 0.25em;">${otp}</span>
          </div>
          <p style="color: #718096; font-size: 11px;">
            This code expires in 10 minutes. If you did not initialize this grid handshake, secure your firewalls immediately.
          </p>
        </div>
      </div>
    `;

    if (mailTransporter) {
      const info = await mailTransporter.sendMail({
        from: '"CYBERNETIX SECURE" <no-reply@cybernetix.grid>',
        to: email,
        subject: `[SECURE] Verification Key: ${otp}`,
        html
      });
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        console.log(`✉️ [MAIL] Sent OTP code to ${email}. View mail here: ${url}`);
      } else {
        console.log(`✉️ [MAIL] Sent OTP code to ${email}`);
      }
    } else {
      console.log(`✉️ [MAIL LOG DEV] OTP sent to ${email} -> CODE: [ ${otp} ]`);
    }
  } catch (mailErr) {
    console.warn("⚠️ [MAIL] FAILED TO SEND OTP EMAIL VIA SMTP. FALLING BACK TO CONSOLE LOG.", mailErr);
    console.log(`✉️ [MAIL LOG DEV FALLBACK] OTP sent to ${email} -> CODE: [ ${otp} ]`);
  }
};

export const sendOrderConfirmationEmail = async (email: string, order: any, clientName: string) => {
  const mailTransporter = await getTransporter();

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; font-size: 13px;">${item.name}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a0aec0; font-size: 13px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #00F5FF; font-size: 13px; text-align: right;">${item.price.toLocaleString()} CR</td>
    </tr>
  `).join('');

  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${logoStyle}">CYBERNETIX INVOICE</div>
        <h2 style="color: #ffffff; font-size: 20px;">TRANSACTION STABLE</h2>
        <p style="color: #a0aec0; font-size: 13px;">
          Greetings <b>${clientName}</b>, your payment credits have been secured. The transaction is verified in the block ledger.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(0, 245, 255, 0.3);">
              <th style="text-align: left; padding-bottom: 8px; color: #a0aec0; font-size: 11px; text-transform: uppercase;">Aesthetic Node</th>
              <th style="text-align: center; padding-bottom: 8px; color: #a0aec0; font-size: 11px; text-transform: uppercase;">Qty</th>
              <th style="text-align: right; padding-bottom: 8px; color: #a0aec0; font-size: 11px; text-transform: uppercase;">Credits</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding-top: 15px; font-weight: bold; color: #a0aec0; font-size: 13px;">INVOICE TOTAL</td>
              <td style="padding-top: 15px; font-weight: bold; color: #00F5FF; font-size: 15px; text-align: right;">${order.totalAmount.toLocaleString()} CR</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #08080c; border: 1px dashed rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <div style="font-size: 11px; color: #718096; text-transform: uppercase;">DRONE DISPATCH CODE</div>
          <div style="font-size: 15px; color: #8B5CF6; font-weight: bold; font-family: monospace; margin-top: 3px;">${order.trackingCode}</div>
        </div>

        <p style="color: #718096; font-size: 11px; line-height: 1.5;">
          Our supersonic MagLev cargo delivery system is computing trajectory paths now. Monitor coordinates on your dashboard.
        </p>
      </div>
    </div>
  `;

  if (mailTransporter) {
    const info = await mailTransporter.sendMail({
      from: '"CYBERNETIX SALES" <sales@cybernetix.grid>',
      to: email,
      subject: `[INVOICE] Transaction Ledger Confirmed: ${order.id}`,
      html
    });
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      console.log(`✉️ [MAIL] Sent Invoice to ${email}. View Invoice: ${url}`);
    } else {
      console.log(`✉️ [MAIL] Sent Invoice to ${email}`);
    }
  } else {
    console.log(`✉️ [MAIL LOG DEV] Invoice sent to ${email} for total: ${order.totalAmount} CR. Code: ${order.trackingCode}`);
  }
};

export const sendShippingUpdateEmail = async (email: string, order: any, clientName: string) => {
  const mailTransporter = await getTransporter();
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${logoStyle}">CYBERNETIX TRANSIT</div>
        <h2 style="color: #ffffff; font-size: 20px;">DRONE LAUNCHED</h2>
        <p style="color: #a0aec0; font-size: 14px; line-height: 1.6;">
          Runner <b>${clientName}</b>, cargo ship vectors have been locked. Status of order <b>${order.id}</b> is updated to:
        </p>
        <div style="background-color: #1a1a2e; border: 1px solid #00F5FF; padding: 15px 30px; text-align: center; border-radius: 8px; margin: 30px 0;">
          <span style="font-size: 20px; font-weight: bold; color: #00F5FF; text-transform: uppercase;">${order.status}</span>
        </div>
        <p style="color: #a0aec0; font-size: 13px;">
          Vector tracking reference: <b>${order.trackingCode}</b>. Drone is at atmospheric flight cruising levels.
        </p>
      </div>
    </div>
  `;

  if (mailTransporter) {
    const info = await mailTransporter.sendMail({
      from: '"CYBERNETIX LOGISTICS" <logistics@cybernetix.grid>',
      to: email,
      subject: `[TRANSIT] Drone Dispatched for Order: ${order.id}`,
      html
    });
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      console.log(`✉️ [MAIL] Sent shipping update to ${email}. Link: ${url}`);
    }
  } else {
    console.log(`✉️ [MAIL LOG DEV] Shipping update to ${email} -> STATUS: ${order.status}`);
  }
};

export const sendSellerOrderAlert = async (sellerEmail: string, sellerName: string, orderId: string, totalVal: number) => {
  const mailTransporter = await getTransporter();
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${logoStyle}">CYBERNETIX VENDOR</div>
        <h2 style="color: #ffffff; font-size: 20px;">NEW SALES SIGNAL INCOMING</h2>
        <p style="color: #a0aec0; font-size: 14px; line-height: 1.6;">
          Greetings Vendor <b>${sellerName}</b>, a client has purchased nodes from your inventory register.
        </p>
        <div style="background-color: #08080c; border: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0;">
          <div style="font-size: 11px; color: #718096; text-transform: uppercase;">ORDER TELEMETRY ID</div>
          <div style="font-size: 16px; color: #ffffff; font-weight: bold; margin-bottom: 12px; font-family: monospace;">${orderId}</div>
          
          <div style="font-size: 11px; color: #718096; text-transform: uppercase;">INVENTORY SHARE REVENUE</div>
          <div style="font-size: 20px; color: #FF00FF; font-weight: bold;">${totalVal.toLocaleString()} CR</div>
        </div>
        <p style="color: #a0aec0; font-size: 13px;">
          Accept this order inside the Employee/Seller control terminal to execute package synthesis.
        </p>
      </div>
    </div>
  `;

  if (mailTransporter) {
    const info = await mailTransporter.sendMail({
      from: '"CYBERNETIX MERCHANT DECK" <merchant@cybernetix.grid>',
      to: sellerEmail,
      subject: `[SALES] New Purchase Order Alert: ${orderId}`,
      html
    });
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      console.log(`✉️ [MAIL] Sent merchant notice. Link: ${url}`);
    }
  } else {
    console.log(`✉️ [MAIL LOG DEV] Merchant Notice to ${sellerEmail} for order ${orderId} (value: ${totalVal} CR)`);
  }
};
