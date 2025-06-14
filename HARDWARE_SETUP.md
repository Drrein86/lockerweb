# הגדרת שרת החומרה ללוקרים חכמים

## דרישות מערכת

### חומרה
- **Raspberry Pi 4** (מומלץ) או מחשב Linux/Windows
- **ממסרים** (Relays) לשליטה בנעילת הלוקרים
- **חיישני דלת** (Door sensors) לזיהוי פתיחה/סגירה
- **LED אורות** לחיווי סטטוס
- **חיבור אינטרנט** (WiFi או Ethernet)

### תוכנה
- **Node.js** גרסה 16 ואילך
- **NPM** או **Yarn**
- **Git** (אופציונלי)

## התקנה

### 1. הורדת הקבצים
```bash
# אם יש Git
git clone https://github.com/Drrein86/lockerweb.git
cd lockerweb

# או הורדה ידנית של הקובץ
wget https://raw.githubusercontent.com/Drrein86/lockerweb/main/locker-hardware-server.js
```

### 2. התקנת תלויות
```bash
npm install ws
```

### 3. הפעלת השרת
```bash
node locker-hardware-server.js
```

## הגדרת חיבור חומרה

### Raspberry Pi - GPIO
עבור Raspberry Pi, יש להוסיף לקובץ `locker-hardware-server.js`:

```javascript
const { Gpio } = require('onoff');

// הגדרת פינים לממסרים (נעילה/פתיחה)
const relayPins = {
  'LOC001': {
    'A1': new Gpio(18, 'out'),
    'A2': new Gpio(19, 'out'),
    'A3': new Gpio(20, 'out'),
    'B1': new Gpio(21, 'out'),
    'B2': new Gpio(26, 'out')
  }
};

// הגדרת פינים לחיישני דלת
const sensorPins = {
  'LOC001': {
    'A1': new Gpio(2, 'in', 'both'),
    'A2': new Gpio(3, 'in', 'both'),
    'A3': new Gpio(4, 'in', 'both'),
    'B1': new Gpio(17, 'in', 'both'),
    'B2': new Gpio(27, 'in', 'both')
  }
};

// פונקציה לפתיחת תא - חיבור GPIO
function unlockCellHardware(lockerId, cellId) {
  const relay = relayPins[lockerId]?.[cellId];
  if (relay) {
    relay.writeSync(1); // הפעלת ממסר
    setTimeout(() => {
      relay.writeSync(0); // כיבוי ממסר אחרי 3 שניות
    }, 3000);
    return true;
  }
  return false;
}
```

### Arduino/ESP32
עבור מיקרו-בקרים, יש לחבר דרך Serial:

```javascript
const { SerialPort } = require('serialport');

const port = new SerialPort({
  path: '/dev/ttyUSB0', // Linux
  // path: 'COM3',      // Windows
  baudRate: 9600
});

function unlockCellHardware(lockerId, cellId) {
  const command = `UNLOCK:${lockerId}:${cellId}\n`;
  port.write(command);
  return true;
}
```

## הגדרת רשת

### 1. כתובת IP סטטית
```bash
# עבור Raspberry Pi
sudo nano /etc/dhcpcd.conf

# הוסף:
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8
```

### 2. פתיחת פורט בחומת האש
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# Windows
netsh advfirewall firewall add rule name="Locker Server" dir=in action=allow protocol=TCP localport=8080
```

### 3. הגדרת משתני סביבה
```bash
# יצירת קובץ .env
echo "PORT=8080" > .env
echo "LOCKER_ID=LOC001" >> .env
```

## הפעלה אוטומטית

### SystemD (Linux)
```bash
sudo nano /etc/systemd/system/locker-server.service
```

```ini
[Unit]
Description=Smart Locker Hardware Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/lockerweb
ExecStart=/usr/bin/node locker-hardware-server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable locker-server
sudo systemctl start locker-server
```

### PM2 (Cross-platform)
```bash
npm install -g pm2
pm2 start locker-hardware-server.js --name "locker-server"
pm2 startup
pm2 save
```

## חיבור לאפליקציה

### 1. IP מקומי
האפליקציה תתחבר ל: `ws://192.168.1.100:8080`

### 2. חיבור חיצוני (ngrok)
```bash
npm install -g ngrok
ngrok http 8080
```
האפליקציה תתחבר ל: `wss://abc123.ngrok.io`

### 3. עדכון כתובת באפליקציה
יש לעדכן את המשתנה `HARDWARE_SERVER_URL` ב-Vercel:
```
HARDWARE_SERVER_URL=ws://192.168.1.100:8080
```

## בדיקה ואבחון

### 1. בדיקת חיבור
```bash
# בדיקת HTTP
curl http://localhost:8080

# בדיקת WebSocket
npm install -g wscat
wscat -c ws://localhost:8080
```

### 2. לוגים
```bash
# SystemD
sudo journalctl -u locker-server -f

# PM2
pm2 logs locker-server
```

### 3. בדיקת פורטים
```bash
netstat -tlnp | grep 8080
```

## אבטחה

### 1. הגדרת אימות
```javascript
// הוספה לקובץ השרת
const API_KEY = process.env.API_KEY || 'your-secret-key';

ws.on('message', (message) => {
  const data = JSON.parse(message);
  
  if (data.apiKey !== API_KEY) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Unauthorized'
    }));
    return;
  }
  
  // המשך העיבוד...
});
```

### 2. הגדרת HTTPS/WSS
```bash
# יצירת אישור SSL
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

## תחזוקה

### 1. עדכון תוכנה
```bash
git pull origin main
npm install
pm2 restart locker-server
```

### 2. גיבוי הגדרות
```bash
tar -czf locker-backup-$(date +%Y%m%d).tar.gz locker-hardware-server.js .env
```

## פתרון בעיות

### בעיות נפוצות:
1. **פורט תפוס**: `killall node` או שנה פורט
2. **בעיות הרשאות**: `sudo chmod +x locker-hardware-server.js`
3. **בעיות רשת**: בדוק חומת אש וחיבור אינטרנט
4. **בעיות GPIO**: `sudo usermod -a -G gpio pi`

### תמיכה
- **GitHub Issues**: https://github.com/Drrein86/lockerweb/issues
- **לוגים מפורטים**: הוסף `DEBUG=true` למשתני הסביבה 