const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
});

exports.sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: `"RAY ENGINEERING" <${process.env.MAIL_USER}>`,
    to,
    subject: "🔐 Password Reset OTP | RAY ENGINEERING",
    html: `
      <div style="
        max-width:600px;
        margin:0 auto;
        font-family:Arial, Helvetica, sans-serif;
        background:#f4f6f8;
        padding:20px;
      ">

        <!-- Banner -->
        <div style="
          background:linear-gradient(90deg,#4dafff,#b47bff);
          padding:20px;
          border-radius:12px 12px 0 0;
          text-align:center;
          color:#ffffff;
        ">
          <h1 style="margin:0;font-size:22px;letter-spacing:1px;">
            RAY ENGINEERING
          </h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.95;">
            E-Procurement System
          </p>
        </div>

        <!-- Content -->
        <div style="
          background:#ffffff;
          padding:28px;
          border-radius:0 0 12px 12px;
          box-shadow:0 6px 20px rgba(0,0,0,0.08);
        ">
          <h2 style="
            margin-top:0;
            color:#333333;
            font-size:18px;
          ">
            Password Reset Request
          </h2>

          <p style="
            color:#555555;
            font-size:14px;
            line-height:1.6;
          ">
            We received a request to reset your password.  
            Please use the OTP below to continue.
          </p>

          <!-- OTP BOX -->
          <div style="
            margin:24px 0;
            text-align:center;
          ">
            <div style="
              display:inline-block;
              padding:14px 28px;
              font-size:24px;
              letter-spacing:6px;
              font-weight:bold;
              color:#4dafff;
              background:#f1f7ff;
              border:1px dashed #4dafff;
              border-radius:10px;
            ">
              ${otp}
            </div>
          </div>

          <p style="
            color:#555555;
            font-size:14px;
          ">
            ⏱ This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p style="
            color:#888888;
            font-size:13px;
            line-height:1.5;
          ">
            If you did not request a password reset, please ignore this email.
            Your account remains secure.
          </p>

          <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">

          <p style="
            font-size:12px;
            color:#999999;
            text-align:center;
          ">
            © ${new Date().getFullYear()} RAY ENGINEERING RE-PROCUREMENT<br/>
            Powered by SMARTNEX Technologies
          </p>
        </div>
      </div>
    `,
  });
};
