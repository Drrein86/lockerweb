import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// טעינת קובץ התצורה
const configPath = path.join(process.cwd(), 'storage', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// יצירת מופע של Google Cloud Storage
const storage = new Storage({
  credentials: config.credentials,
  projectId: config.credentials.project_id
});

const bucket = storage.bucket(config.bucket);

export async function downloadSnapshot(snapshotId: string): Promise<string> {
  try {
    // יצירת נתיב מלא לקובץ
    const filePath = path.join(config.path, snapshotId);
    
    // בדיקה אם הקובץ קיים
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new Error(`הקובץ ${filePath} לא קיים`);
    }
    
    // יצירת תיקיית היעד אם לא קיימת
    const localPath = path.join(process.cwd(), 'storage', 'snapshots');
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    
    // הורדת הקובץ
    const localFilePath = path.join(localPath, snapshotId);
    await file.download({ destination: localFilePath });
    
    return localFilePath;
  } catch (error) {
    console.error('שגיאה בהורדת סנאפשוט:', error);
    throw error;
  }
}

export async function uploadSnapshot(localFilePath: string, snapshotId: string): Promise<void> {
  try {
    const filePath = path.join(config.path, snapshotId);
    await bucket.upload(localFilePath, {
      destination: filePath,
      metadata: {
        contentType: 'application/zip'
      }
    });
  } catch (error) {
    console.error('שגיאה בהעלאת סנאפשוט:', error);
    throw error;
  }
} 