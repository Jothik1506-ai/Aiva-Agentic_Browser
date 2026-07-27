# 🚀 Quick Start Guide - Backend Server

## ⚠️ IMPORTANT: Backend Must Be Running

The frontend **requires** the backend server to be running to function properly.

## 🎯 Fastest Way to Start Backend

### Option 1: Use the Batch File (Windows)
**Just double-click this file:**
```
start_backend.bat
```

### Option 2: Use Terminal/PowerShell

1. **Open a new terminal/PowerShell window**

2. **Navigate to backend folder:**
   ```powershell
   cd backend
   ```

3. **Start the server:**
   ```powershell
   python server.py
   ```

4. **Wait for this message:**
   ```
   ============================================================
   🔄 Server starting...
   ============================================================
   ```

5. **Keep this terminal open** - Don't close it! The server needs to keep running.

6. **Go back to your Electron app** and refresh the page (F5 or Ctrl+R)

## ✅ How to Know It's Working

When the backend starts successfully, you should see:
```
============================================================
🚀 Starting Aiva-Agentic-browser Backend Server
============================================================
📍 Server URL: http://localhost:5000
📍 API Base: http://localhost:5000/api
📍 Status Check: http://localhost:5000/api/status
============================================================
✅ MediaPipe Face Mesh: Initialized
✅ YOLOv8 Pose Model: Ready
✅ CORS: Enabled for all origins
============================================================
🔄 Server starting...
============================================================
INFO:     Uvicorn running on http://0.0.0.0:5000 (Press CTRL+C to quit)
```

## 🔍 Test If Backend Is Running

Open a browser and go to:
```
http://localhost:5000/api/status
```

You should see:
```json
{
  "status": "running",
  "backend": "FastAPI/YOLOv8/MediaPipe",
  "face_mesh_ready": true,
  "message": "Backend is operational and ready for face analysis"
}
```

## ❌ Troubleshooting

### "Python is not recognized"
- Install Python 3.8+ from [python.org](https://www.python.org/downloads/)
- Make sure to check "Add Python to PATH" during installation
- Restart your terminal after installing

### "Module not found" errors
Run this in the backend folder:
```powershell
pip install -r requirements.txt
```

### "Port 5000 already in use"
1. Find what's using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Kill that process, or
3. Change the port in `backend/server.py` (line 556)

### Backend starts but frontend still shows error
1. Check if backend is actually running (see "Test If Backend Is Running" above)
2. Make sure backend is on `http://localhost:5000`
3. Try refreshing the Electron app (F5)
4. Check browser console for errors (F12)

## 💡 Pro Tip

Keep the backend terminal window visible so you can see if there are any errors. The server logs will show what's happening.
