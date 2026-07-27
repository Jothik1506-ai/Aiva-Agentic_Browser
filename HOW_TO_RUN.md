# 🚀 How to Run Aiva-Agentic-browser

## Quick Start Guide

### Terminal 1 - Backend Server (Python FastAPI)

```powershell
cd "c:\Users\Dell\OneDrive\Desktop\New folder\Microsoft\Imagine-Cup\backend"
python server.py
```

This will start the FastAPI server on **http://127.0.0.1:5000** with YOLOv8 pose estimation.

---

### Terminal 2 - Frontend (Electron Browser)

```powershell
cd "c:\Users\Dell\OneDrive\Desktop\New folder\Microsoft\Imagine-Cup"
npm start
```

This will launch the Electron-based Aiva-Agentic-browser application.

---

## ✅ Current Status

**Frontend (Electron)**: ✅ **RUNNING**
- The Electron window should be visible on your screen

**Backend (FastAPI)**: ✅ **RUNNING**
- I have already started this for you in the background.

---

## 📝 Important Notes

1. **Always run from the correct directory**: `c:\Users\Dell\OneDrive\Desktop\New folder\Microsoft\Imagine-Cup`
2. **Backend must be in**: `backend\` folder
3. **Start backend FIRST**, then frontend
4. **To stop**: Press `Ctrl+C` in each terminal

---

## 🔧 Troubleshooting

**Port 5000 already in use?**
- Stop any running Python processes
- Or restart your computer to clear the port

**Module not found errors?**
- Make sure you installed dependencies: `pip install -r requirements.txt`

**Electron not found?**
- Make sure you ran: `npm install`
