# Rischis Kiosk Backend

Eine kleine Express-Anwendung zur Verwaltung eines digitalen Kiosks. Die Anwendung nutzt Supabase als Datenbank.

## Installation

```bash
cd kiosk-backend
npm install
```

## Entwicklung starten

```bash
npm start
```

## Umgebungsvariablen

Legen Sie eine `.env` Datei im Verzeichnis `kiosk-backend` an oder nutzen Sie die bereitgestellte `.env.example` als Vorlage.

| Variable                | Beschreibung                              |
|-------------------------|-------------------------------------------|
| `SUPABASE_URL`          | URL Ihres Supabase Projekts               |
| `SUPABASE_SERVICE_ROLE` | Service Role Key von Supabase             |
| `PORT`                  | Port, auf dem der Server läuft (optional) |
| `COOKIE_DOMAIN`         | Domain für Cookies (optional)             |

## Formatierung und Linting

Das Projekt verwendet ESLint und Prettier zur Code-Qualität. Die folgenden Befehle stehen zur Verfügung:

```bash
npm run lint     # Code mit ESLint prüfen
npm run format   # Code mit Prettier formatieren
```
