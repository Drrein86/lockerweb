const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000
const wsPort = process.env.WS_PORT || 8081

// הפעלת Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// WebSocket Server
const wss = new WebSocketServer({ port: wsPort })

// חיבורי לוקרים
const connectedLockers = new Map()

wss.on('connection', (ws, request) => {
  console.log('🔗 לוקר התחבר')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      if (data.type === 'register') {
        connectedLockers.set(data.lockerId, ws)
        console.log(`📍 לוקר ${data.lockerId} נרשם`)
        
        ws.send(JSON.stringify({
          type: 'registered',
          lockerId: data.lockerId,
          timestamp: new Date().toISOString()
        }))
      }
    } catch (error) {
      console.error('❌ שגיאה בפענוח הודעה:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('📡 לוקר התנתק')
    // הסרת הלוקר מהרשימה
    for (const [lockerId, socket] of connectedLockers.entries()) {
      if (socket === ws) {
        connectedLockers.delete(lockerId)
        console.log(`🔌 לוקר ${lockerId} הוסר מהרשימה`)
        break
      }
    }
  })
})

// פונקציה לפתיחת תא
global.openLockerCell = async (lockerId, cellCode) => {
  const lockerWs = connectedLockers.get(lockerId)
  
  if (lockerWs && lockerWs.readyState === 1) {
    lockerWs.send(JSON.stringify({
      type: 'openCell',
      cellCode,
      timestamp: new Date().toISOString()
    }))
    
    console.log(`🔓 פקודת פתיחה נשלחה ללוקר ${lockerId}, תא ${cellCode}`)
    return true
  } else {
    console.log(`❌ לוקר ${lockerId} לא מחובר`)
    return false
  }
}

// הפעלת Next.js server
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server on port ${wsPort}`)
  })
}) 