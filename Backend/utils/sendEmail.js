import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendEmail = async (to, otp, type) => {

    // Only allow these two email types
    if (!["signup", "forgot-password"].includes(type)) {
        throw new Error("Invalid email type");
    }

    const isSignup = type === "signup";

    // =========================
    // EMAIL CONTENT
    // =========================

    const subject = isSignup
        ? "Verify your CodeGPM account"
        : "Reset your CodeGPM password";

    const title = isSignup
        ? "Verify your account"
        : "Forgot your password?";

    const description = isSignup
        ? "Welcome to CodeGPM! Use the verification code below to complete your registration."
        : "We received a request to reset your CodeGPM password. Use the verification code below to continue.";

    const codeLabel = isSignup
        ? "VERIFICATION CODE"
        : "PASSWORD RESET CODE";

    const warning = isSignup
        ? "If you didn't create a CodeGPM account, you can safely ignore this email."
        : "If you didn't request a password reset, you can safely ignore this email.";

    const text = isSignup
        ? `Your CodeGPM verification code is ${otp}. This code expires in 5 minutes.`
        : `Your CodeGPM password reset code is ${otp}. This code expires in 5 minutes.`;


    // =========================
    // HTML TEMPLATE
    // =========================

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>

    <body style="
        margin: 0;
        padding: 0;
        background-color: #f5f3ff;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
    ">

        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
                padding: 40px 15px;
                background-color: #f5f3ff;
            "
        >
            <tr>
                <td align="center">

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                            max-width: 520px;
                            background-color: #ffffff;
                            border-radius: 16px;
                            overflow: hidden;
                            box-shadow: 0 8px 30px rgba(76,29,149,0.08);
                        "
                    >

                        <!-- HEADER -->
                        <tr>
                            <td
                                align="center"
                                style="
                                    background-color: #4c1d95;
                                    padding: 28px 20px;
                                "
                            >

                                <div style="
                                    color: #ffffff;
                                    font-size: 27px;
                                    font-weight: bold;
                                ">
                                    CodeGPM
                                </div>

                                <div style="
                                    color: #ddd6fe;
                                    font-size: 13px;
                                    margin-top: 6px;
                                ">
                                    Group Project Manager
                                </div>

                            </td>
                        </tr>


                        <!-- BODY -->
                        <tr>
                            <td style="padding: 36px 32px;">

                                <h2 style="
                                    margin: 0 0 16px;
                                    text-align: center;
                                    font-size: 23px;
                                    color: #111827;
                                ">
                                    ${title}
                                </h2>


                                <p style="
                                    margin: 0;
                                    text-align: center;
                                    color: #6b7280;
                                    font-size: 15px;
                                    line-height: 1.6;
                                ">
                                    ${description}
                                </p>


                                <!-- OTP -->
                                <div style="
                                    margin: 30px 0;
                                    padding: 22px;
                                    background-color: #f5f3ff;
                                    border: 1px solid #ddd6fe;
                                    border-radius: 12px;
                                    text-align: center;
                                ">

                                    <div style="
                                        font-size: 12px;
                                        color: #7c3aed;
                                        font-weight: bold;
                                        letter-spacing: 1.2px;
                                        margin-bottom: 12px;
                                    ">
                                        ${codeLabel}
                                    </div>

                                    <div style="
                                        font-size: 36px;
                                        font-weight: bold;
                                        letter-spacing: 8px;
                                        color: #4c1d95;
                                    ">
                                        ${otp}
                                    </div>

                                </div>


                                <!-- EXPIRATION -->
                                <p style="
                                    text-align: center;
                                    color: #6b7280;
                                    font-size: 14px;
                                    margin: 0;
                                ">
                                    This code expires in
                                    <strong style="color: #4c1d95;">
                                        5 minutes
                                    </strong>.
                                </p>


                                <div style="
                                    border-top: 1px solid #eeeeee;
                                    margin: 30px 0 22px;
                                "></div>


                                <!-- SECURITY -->
                                <p style="
                                    margin: 0;
                                    color: #9ca3af;
                                    font-size: 13px;
                                    line-height: 1.6;
                                    text-align: center;
                                ">
                                    ${warning}
                                    <br><br>
                                    Never share this code with anyone.
                                </p>

                            </td>
                        </tr>


                        <!-- FOOTER -->
                        <tr>
                            <td
                                align="center"
                                style="
                                    padding: 20px;
                                    background-color: #fafafa;
                                    border-top: 1px solid #eeeeee;
                                    color: #9ca3af;
                                    font-size: 12px;
                                "
                            >
                                © ${new Date().getFullYear()} CodeGPM
                                <br>
                                Group Project Manager
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
    `;


    // =========================
    // SEND
    // =========================

    await transporter.sendMail({
        from: `"CodeGPM" <${process.env.EMAIL}>`,
        to,
        subject,
        text,
        html,
    });
};

export default sendEmail;