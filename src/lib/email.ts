import nodemailer from 'nodemailer'

// הגדרת SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailNotificationData {
  to: string
  name: string
  packageId: string
  lockerLocation: string
  cellNumber: number
}

export async function sendNotificationEmail(data: EmailNotificationData) {
  const { to, name, packageId, lockerLocation, cellNumber } = data

  const unlockUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/customer/unlock/${packageId}`

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: '📦 החבילה שלך מחכה! - מערכת לוקרים חכמים',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>החבילה שלך מחכה</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background-color: #f5f5f5;
                  direction: rtl;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .content {
                  padding: 30px;
              }
              .highlight {
                  background-color: #e3f2fd;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border-right: 4px solid #2196f3;
              }
              .unlock-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #4caf50, #45a049);
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 25px;
                  font-weight: bold;
                  font-size: 18px;
                  margin: 20px 0;
                  text-align: center;
              }
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin: 20px 0;
              }
              .info-item {
                  background-color: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
              }
              .footer {
                  background-color: #f8f9fa;
                  padding: 20px;
                  text-align: center;
                  color: #666;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🔐 מערכת לוקרים חכמים</h1>
                  <h2>החבילה שלך מחכה!</h2>
              </div>
              
              <div class="content">
                  <p>שלום <strong>${name}</strong>,</p>
                  
                  <p>החבילה שלך הגיעה ומחכה לך בלוקר החכם!</p>
                  
                  <div class="highlight">
                      <h3>📍 פרטי האיסוף</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <strong>📍 מיקום הלוקר:</strong><br>
                              ${lockerLocation}
                          </div>
                          <div class="info-item">
                              <strong>🔢 מספר התא:</strong><br>
                              <span style="font-size: 24px; color: #4caf50; font-weight: bold;">${cellNumber}</span>
                          </div>
                          <div class="info-item">
                              <strong>🔍 מזהה חבילה:</strong><br>
                              <span style="font-family: monospace; background: #e8f5e8; padding: 5px; border-radius: 4px;">${packageId}</span>
                          </div>
                          <div class="info-item">
                              <strong>⏰ זמן אספקה:</strong><br>
                              ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL')}
                          </div>
                      </div>
                  </div>
                  
                  <div style="text-align: center;">
                      <a href="${unlockUrl}" class="unlock-button">
                          🔓 פתח לוקר
                      </a>
                  </div>
                  
                  <p><strong>הוראות שימוש:</strong></p>
                  <ol>
                      <li>לחץ על הכפתור "פתח לוקר" או העתק את הקישור</li>
                      <li>גש למיקום הלוקר</li>
                      <li>התא ייפתח אוטומטית</li>
                      <li>קח את החבילה שלך</li>
                  </ol>
                  
                  <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-right: 4px solid #ffc107;">
                      <strong>⚠️ חשוב לדעת:</strong><br>
                      • הקישור תקף למשך 7 ימים מרגע הקבלה<br>
                      • התא ינעל אוטומטית לאחר 30 שניות<br>
                      • במקרה של בעיה, צור קשר בטלפון: 03-1234567
                  </div>
              </div>
              
              <div class="footer">
                  <p>תודה שבחרת במערכת הלוקרים החכמים שלנו! 🚀</p>
                  <p>מייל זה נשלח אוטומטית, אנא אל תענה עליו.</p>
              </div>
          </div>
      </body>
      </html>
    `,
    text: `
שלום ${name},

החבילה שלך מחכה בלוקר החכם!

פרטי האיסוף:
📍 מיקום: ${lockerLocation}
🔢 תא: ${cellNumber}
🔍 מזהה חבילה: ${packageId}

לפתיחת התא: ${unlockUrl}

תודה שבחרת במערכת הלוקרים החכמים שלנו!
    `
  }

  return await transporter.sendMail(mailOptions)
} 