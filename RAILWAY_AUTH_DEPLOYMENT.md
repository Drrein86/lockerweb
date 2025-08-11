# 🚀 הוראות פריסה ל-Railway עם מערכת אימות

## 📋 סקירה כללית

מערכת האימות נבנתה להתאים ל-Railway עם PostgreSQL. הנה השלבים לפריסה מלאה:

## 🔧 הגדרות נדרשות ב-Railway

### 1. משתני סביבה (Environment Variables)

הגדר את המשתנים הבאים ב-Railway:

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-for-production
NODE_ENV=production
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 2. הגדרת PostgreSQL

1. **צור שירות PostgreSQL** ב-Railway
2. **העתק את DATABASE_URL** לאפליקציה
3. **ודא שהחיבור עובד**

## 🚚 תהליך הפריסה

### שלב 1: הכנת הקוד

```bash
# בדיקת הקוד מקומית
npm run lint
npm run build

# התחברות ל-Railway
npm run railway:login

# פריסה ל-Railway
npm run railway:deploy
```

### שלב 2: הרצת Migration

לאחר הפריסה, יש להריץ migration ב-Railway:

```bash
# בתוך Railway Console או דרך CLI
npx prisma migrate deploy
npx prisma generate
```

### שלב 3: יצירת משתמש אדמין

לאחר הפריסה והמיגרציה, הרץ:

```bash
npm run railway:setup-auth
```

או בחלופה, שלח POST request ל:
```
https://your-app.railway.app/api/setup-admin
```

עם body:
```json
{
  "authorization": "setup-admin-2025"
}
```

## 👤 פרטי המשתמש האדמין

לאחר ההגדרה, המשתמש האדמין יהיה:

- **מייל:** elior2280@gmail.com
- **סיסמא:** 123
- **תפקיד:** אדמין (גישה מלאה)

## 🔐 תכונות מערכת האימות

### ✅ מה שכלול:

1. **התחברות** עם מייל וסיסמא
2. **הרשמה** עם אישור אדמין
3. **5 תפקידים:** אדמין, ניהול, שליח, עסק, שירות לקוחות
4. **הרשאות מפורטות** לכל דף במערכת
5. **middleware** המגן על כל הדפים
6. **דף ניהול משתמשים** מלא לאדמין

### 🎯 דפי המערכת:

**🔐 הרשאות:**
- `/auth/signin` - התחברות
- `/auth/register` - הרשמה
- `/auth/pending-approval` - ממתין לאישור
- `/unauthorized` - אין הרשאה

**🔧 ניהול (רק לאדמין):**
- `/admin/users` - ניהול משתמשים והרשאות
- `/admin/lockers` - ניהול לוקרים
- `/admin/packages` - ניהול חבילות
- `/admin/settings` - הגדרות מערכת

## 🧪 בדיקת המערכת

לאחר הפריסה:

1. **כנס לאתר:** `https://your-app.railway.app`
2. **לחץ על התחברות**
3. **התחבר כאדמין** עם הפרטים למעלה
4. **בדוק ניהול משתמשים:** `/admin/users`
5. **נסה להירשם כמשתמש חדש**
6. **אשר את המשתמש החדש כאדמין**

## 🔧 פתרון בעיות

### בעיות נפוצות:

1. **DATABASE_URL לא מוגדר:**
   - ודא שהגדרת את כל משתני הסביבה ב-Railway

2. **Migration נכשל:**
   ```bash
   npx prisma migrate reset --force
   npx prisma migrate deploy
   ```

3. **אדמין לא נוצר:**
   - הרץ שוב: `npm run railway:setup-auth`
   - או בדוק ב-Railway logs

4. **שגיאות אימות:**
   - ודא שה-JWT_SECRET מוגדר
   - בדוק שה-cookies עובדים

## 📊 מעקב ולוגים

```bash
# צפייה בלוגים של Railway
npm run railway:logs

# בדיקת סטטוס
npm run railway:status
```

## 🚀 לאחר הפריסה

המערכת מוכנה! כל המפתחים יכולים:

1. **להירשם** באתר
2. **לחכות לאישור** מהאדמין
3. **לקבל הרשאות** מותאמות אישית
4. **לעבוד** על הפרויקט עם גישה מוגבלת

---

**הערה חשובה:** מסד הנתונים ב-Railway הוא הסביבה האמיתית של הפרויקט. כל השינויים והמשתמשים יישמרו שם!
