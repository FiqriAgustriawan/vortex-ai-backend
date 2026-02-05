# Vortex AI Backend

Express.js API backend for Vortex AI Chat Application with Gemini AI integration.

## Features

- 🤖 Gemini AI chat with streaming support
- 🖼️ Image generation with Imagen
- 💾 MongoDB for conversation persistence
- 🔄 In-memory fallback when database unavailable
- 🚀 Vercel deployment ready

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | Chat with AI |
| `POST` | `/api/chat/stream` | Streaming chat |
| `GET` | `/api/conversations` | List conversations |
| `POST` | `/api/conversations` | Create conversation |
| `GET` | `/api/conversations/:id` | Get conversation |
| `PUT` | `/api/conversations/:id` | Update conversation |
| `DELETE` | `/api/conversations/:id` | Delete conversation |
| `POST` | `/api/image/generate` | Generate image |

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```
