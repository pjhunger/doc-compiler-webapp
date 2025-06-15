# Doc Compiler Web App

Eine einfache Web-Anwendung zum Kompilieren von Dokumentations-Websites in AI-freundliche Formate.

## Features

🗺️ **Sitemap Discovery** - Automatisches Finden aller Dokumentationsseiten  
🤖 **AI-optimiert** - Perfekt strukturiert für Claude, ChatGPT & Co.  
⚡ **Schnell** - Innerhalb von Sekunden fertig  
📱 **Responsive** - Funktioniert auf Desktop und Mobile  

## Deployment

### Option 1: Vercel (Empfohlen)

1. Fork dieses Repository auf GitHub
2. Gehe zu [vercel.com](https://vercel.com)
3. Klicke "New Project" 
4. Wähle dein GitHub Repository
5. Deploy! 🚀

### Option 2: Netlify

1. Gehe zu [netlify.com](https://netlify.com)
2. Drag & drop den `doc-compiler-webapp` Ordner
3. Oder verbinde mit GitHub für automatische Deployments

### Option 3: Railway

1. Gehe zu [railway.app](https://railway.app)
2. "Deploy from GitHub"
3. Wähle das Repository

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Development server starten
npm run dev

# Build für Production
npm run build
npm start
```

## Kostenlose Limits

**Vercel (kostenlos):**
- 100GB Bandwidth/Monat
- 1000 Serverless Function Invocations/Tag
- Custom Domain möglich

**Netlify (kostenlos):**
- 100GB Bandwidth/Monat  
- 125k Function Invocations/Monat

## Monetarisierung später

Wenn das Tool gut ankommt, kannst du später:

1. **API-Keys einführen** für Power-User
2. **Premium Features** (mehr Seiten, bessere Qualität)
3. **API-as-a-Service** mit Rate Limits
4. **Stripe Integration** für Payments

## Tech Stack

- **Frontend**: Next.js + React + TypeScript
- **Backend**: Next.js API Routes (Serverless)
- **Styling**: CSS-in-JS (styled-jsx)
- **Deployment**: Vercel/Netlify (kostenlos)

## Roadmap

- [ ] Sitemap Integration aus der CLI Version
- [ ] Batch Processing mehrerer URLs
- [ ] Export Formate (PDF, DOCX)
- [ ] User Accounts & Saved Documents
- [ ] Rate Limiting & API Keys
- [ ] Analytics Dashboard