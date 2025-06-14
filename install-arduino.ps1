# 🔧 תוכנת התקנה אוטומטית של Arduino IDE
Write-Host "🚀 מתחיל התקנת Arduino IDE..." -ForegroundColor Green

# יצירת תיקיית הורדות זמנית
$downloadPath = "$env:TEMP\arduino-ide-installer.exe"
$arduinoUrl = "https://downloads.arduino.cc/arduino-ide/arduino-ide_2.2.1_Windows_64bit.exe"

Write-Host "📥 מוריד Arduino IDE..." -ForegroundColor Yellow

try {
    # הורדת קובץ ההתקנה
    Invoke-WebRequest -Uri $arduinoUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✅ הורדה הושלמה" -ForegroundColor Green
    
    # הפעלת ההתקנה
    Write-Host "🔧 מתחיל התקנה..." -ForegroundColor Yellow
    Start-Process -FilePath $downloadPath -ArgumentList "/S" -Wait
    
    Write-Host "✅ Arduino IDE הותקן בהצלחה!" -ForegroundColor Green
    Write-Host "📍 מיקום: C:\Users\$env:USERNAME\AppData\Local\Programs\Arduino IDE" -ForegroundColor Cyan
    
    # ניקוי קובץ זמני
    Remove-Item $downloadPath -Force
    
    Write-Host ""
    Write-Host "🎉 ההתקנה הושלמה!" -ForegroundColor Green
    Write-Host "כעת תוכל לפתוח Arduino IDE ולהמשיך עם ההוראות" -ForegroundColor White
    
} catch {
    Write-Host "Error in installation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please download manually from: https://www.arduino.cc/en/software" -ForegroundColor Yellow
} 