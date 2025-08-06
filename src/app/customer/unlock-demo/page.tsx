'use client';

import { useState } from 'react';

export default function UnlockDemoPage() {
  const [lockerId, setLockerId] = useState('LOC632');
  const [cellId, setCellId] = useState('A1');
  const [packageId, setPackageId] = useState('PKG123456');
  const [clientToken, setClientToken] = useState('TOKEN123456');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/lockers/unlock-cell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lockerId,
          cellId,
          packageId,
          clientToken
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: 'שגיאה בתקשורת עם השרת',
        details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🔓 דוגמה לפתיחת תא על ידי לקוח
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מזהה לוקר
            </label>
            <input
              type="text"
              value={lockerId}
              onChange={(e) => setLockerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="LOC632"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מזהה תא
            </label>
            <input
              type="text"
              value={cellId}
              onChange={(e) => setCellId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מזהה חבילה
            </label>
            <input
              type="text"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PKG123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טוקן לקוח
            </label>
            <input
              type="text"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TOKEN123456"
            />
          </div>

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'שולח בקשה...' : '🔓 פתח תא'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-md">
            {result.status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-green-800 font-medium">✅ הצלחה!</h3>
                <p className="text-green-700 mt-1">{result.message}</p>
                <div className="mt-2 text-sm text-green-600">
                  <p>לוקר: {result.lockerId}</p>
                  <p>תא: {result.cellId}</p>
                  <p>חבילה: {result.packageId}</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-red-800 font-medium">❌ שגיאה</h3>
                <p className="text-red-700 mt-1">{result.error}</p>
                {result.details && (
                  <p className="text-red-600 text-sm mt-1">{result.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">📋 דוגמה להודעה WebSocket:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`{
  "type": "openByClient",
  "lockerId": "${lockerId}",
  "cellId": "${cellId}",
  "packageId": "${packageId}",
  "clientToken": "${clientToken}"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
} 