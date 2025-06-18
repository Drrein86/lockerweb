# הגדרת Railway Database

## שלב 1: התחברות ל-Railway
```bash
railway login
```

## שלב 2: יצירת פרויקט חדש
```bash
railway new
```

## שלב 3: הוספת PostgreSQL Database
```bash
railway add postgresql
```

## שלב 4: קבלת DATABASE_URL
```bash
railway variables
```

## שלב 5: עדכון קובץ .env
העתק את DATABASE_URL מהפלט של הפקודה הקודמת ועדכן את קובץ .env:
```
DATABASE_URL="<הכנס את ה-URL שקיבלת מ-Railway>"
```

## שלב 6: הרצת Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## שלב 7: פריסה ל-Railway
```bash
railway deploy
``` 