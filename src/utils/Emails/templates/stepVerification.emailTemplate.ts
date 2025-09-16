
export const twoStepVerificationTemplate = ({ email, otp }: { email: string, otp: number }): string => {
    return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>2-Step Verification</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f9f9f9;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }

    .container {
      background: #fff;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      width: 360px;
      text-align: center;
    }

    h1 {
      margin-bottom: 18px;
      font-size: 20px;
      color: #111827;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
      background: #fbfdff;
    }

    .option i {
      font-size: 20px;
      color: #4a90e2;
    }

    .text {
      text-align: left;
      font-size: 14px;
      color: #333;
    }

    .text strong {
      display: block;
      font-size: 15px;
      margin-bottom: 4px;
    }

    .otp {
      margin-top: 20px;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 3px;
      color: #4a90e2;
    }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
  <div class="container">
    <h1>2-Step Verification</h1>
    <div class="option">
      <i class="fa fa-envelope"></i>
      <div class="text">
        <strong>Email</strong>
        We sent the code to <span id="userEmail">${email}</span>
      </div>
    </div>
    <div class="otp" id="otpCode">${otp}</div>
  </div>
</body>

</html>`
}