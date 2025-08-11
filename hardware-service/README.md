# 🤖 Hardware Microservice

## 🎯 מטרה
שירות נפרד לטיפול בתקשורת ESP32 - **עובד בצד השרת הראשי ללא הפרעה**

## 🚀 הפעלה
```bash
cd hardware-service
npm install
npm start
```

## 🌐 פורטים
- **API Server**: 8080
- **WebSocket לESP32**: 8081

## 📡 API Endpoints
- `POST /hardware/unlock` - פתיחת תא
- `POST /hardware/lock` - נעילת תא  
- `GET /hardware/status` - סטטוס חיבורים
- `GET /health` - בדיקת בריאות

## 🔄 איך זה עובד
1. ESP32 מתחבר לפורט 8081
2. Next.js שולח בקשות לפורט 8080
3. המicroservice מעביר לESP32
4. שני השרתים חולקים את Railway DB

## ⚠️ חשוב
- השרת הראשי ממשיך לעבוד כרגיל
- זה רק תוספת, לא תחליף
- אפשר להפעיל או לכבות בנפרד
