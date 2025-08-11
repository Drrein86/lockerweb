// קובץ אתחול WebSocket - נטען רק פעם אחת בהפעלת השרת
import { initializeWebSocketIfNeeded } from './websocket-server';

// אתחול מיידי בהפעלת השרת
if (typeof window === 'undefined') {
  console.log('🔌 מאתחל WebSocket מנקודת כניסה מרכזית...');
  initializeWebSocketIfNeeded();
}
