# Panduan Testing Backend Vortex AI

## 🚀 Cara Menjalankan

### 1. Start Backend
```powershell
cd "d:\PKL DOCS\pkltask\Proyek Aplikasi Chat AI\vortex-ai\backend"
$env:GEMINI_API_KEY="AIzaSyCUUIEvFTFgnCBz30_TiczP3z46y51Hi4g"
npm run dev
```

### 2. Start Mobile App
```powershell
cd "d:\PKL DOCS\pkltask\Proyek Aplikasi Chat AI\ai-chat-app"
npx expo start --web
```

---

## 🧪 Testing Backend dengan cURL/PowerShell

### Test 1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```
**Expected:** `{ status: "ok", timestamp: "..." }`

### Test 2: Send Chat Message
```powershell
$body = @{
    message = "Halo, siapa kamu?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/chat" -Method POST -Body $body -ContentType "application/json"
```
**Expected:** `{ response: "...", model: "gemini-2.0-flash" }`

### Test 3: Create Conversation
```powershell
$body = @{
    title = "Test Chat"
    modelId = "gemini-2.0-flash"
    modelName = "Gemini 2.0 Flash"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/conversations" -Method POST -Body $body -ContentType "application/json"
```

### Test 4: Get All Conversations
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/conversations"
```

---

## 🌐 Testing via Browser

Buka browser dan akses:

1. **Health Check:** http://localhost:3001/api/health
2. **API Info:** http://localhost:3001/

---

## 📱 Testing di Mobile App

1. Buka http://localhost:8081 (web) atau scan QR dengan Expo Go
2. Pilih model AI (misal: Gemini 2.0 Flash)
3. Ketik pesan dan kirim
4. Tunggu respons AI (ada loading indicator)

---

## ⚠️ Troubleshooting

### Port 3001 sudah dipakai
```powershell
# Kill semua node process
taskkill /F /IM node.exe

# Atau cari dan kill spesifik
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### API Key tidak terbaca
Pastikan set environment variable:
```powershell
$env:GEMINI_API_KEY="AIzaSyCUUIEvFTFgnCBz30_TiczP3z46y51Hi4g"
```
