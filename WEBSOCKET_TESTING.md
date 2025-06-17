# בדיקת WebSocket לזיהוי לוקרים

## מה תוקן

השרת עכשיו מזהה נכון לוקרים שמתחברים עם הודעת:
```json
{ "type": "identify", "client": "locker", "id": "LOC123" }
```

## איך לבדוק

1. הפעל את השרת החומרה: `node locker-hardware-server.js`
2. הפעל את שרת הפיתוח: `npm run dev`  
3. בדוק חיבור לוקר: `node test-locker-connection.js`

## תוצאה מצופה

הלוקר אמור להתחבר בהצלחה ולהופיע בממשק האדמין ב: `http://localhost:3000/admin/websocket` 