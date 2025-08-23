
export const verifyEmailTemplate = ({ otp = "", userEmail = "" } = {}) => {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Email Confirmation</title>
</head>

<body style="margin:0;padding:0;background:#E9D4EC;font-family:Arial, Helvetica, sans-serif;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
        style="background:#E9D4EC;padding:20px 0;">
        <tr>
            <td align="center">
                <!-- Wrapper -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600"
                    style="background:#FFFFFF;border-radius:8px;overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="padding:20px;text-align:center;background:#F3D6E8;">
                            <img src="https://img.icons8.com/color/96/000000/verified-account.png" alt="Logo"
                                style="display:block;border:0;max-width:120px;margin:0 auto;">
                            <h2
                                style="margin:10px 0 0 0;font-size:20px;color:#D46CB4;font-family:Arial, Helvetica, sans-serif;">
                                Social Media App
                            </h2>
                        </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                        <td style="padding:40px 20px;text-align:center;">
                            <h1 style="margin:0;font-size:24px;color:#333;">Confirm your Email</h1>
                            <p style="margin:16px 0;color:#666;font-size:15px;">
                                We’ve sent a 6-digit code to <strong>${userEmail}</strong>.
                                Please enter it below to confirm your email address.
                            </p>

                            <!-- OTP code -->
                            <h2
                                style="margin:20px 0;border-radius:6px;display:inline-block;padding:12px 24px;background:#D46CB4;color:#fff;font-size:20px;letter-spacing:2px;">
                                ${otp}
                            </h2>

                            <!-- Confirm Button -->
                            <div style="margin:30px 0;">
                               <a href= target="_blank" 
                                    style="background:#D46CB4;color:#fff;text-decoration:none;padding:14px 30px;border-radius:6px;font-weight:bold;display:inline-block;">
                                    Confirm Email
                                </a>
                            </div>

                            <p style="margin:16px 0;color:#666;font-size:14px;">
                                Didn’t receive the email? <a href="" target="_blank"
                                    style="color:#D46CB4;text-decoration:none;">Resend email</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px;background:#F3D6E8;text-align:center;font-size:12px;color:#555;">
                            <p style="margin:0 0 6px 0;">You received this email because you signed up for our service.
                            </p>
                            <p style="margin:0;">&copy; ${new Date().getFullYear()} Your Company. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Wrapper -->
            </td>
        </tr>
    </table>

</body>

</html>`
};