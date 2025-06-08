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
| `COOKIE_SECURE`         | `true` erzwingt Secure-Cookies            |
| `COOKIE_SAMESITE`       | Wert für das SameSite-Attribut            |
| `FORCE_HTTPS`           | `true` leitet HTTP-Anfragen auf HTTPS um  |
| `NODE_ENV`              | Bei `production` werden nur Anfragen von `.de` Domains zugelassen |

Beim Start des Servers werden diese Variablen mit einem Zod-Schema
validiert. Fehlen erforderliche Werte oder sind sie ungültig, wird der
Start abgebrochen.

## Datenbank vorbereiten

Damit Kaufvorgänge funktionieren, muss in Supabase die Funktion
`purchase_product` vorhanden sein. Führen Sie dazu das SQL-Skript
`kiosk-backend/sql/purchase_product.sql` in Ihrem Supabase-Projekt aus.

Anschließend können Produkte im Shop gekauft werden.

## CSRF-Schutz

Der Server stellt unter `/api/csrf-token` einen Endpunkt bereit, der ein
gültiges CSRF-Token zurückliefert. Dieses muss bei schreibenden Anfragen in
das Header-Feld `x-csrf-token` übernommen werden.

## CORS-Einstellungen

Im Entwicklungsmodus sind Anfragen von allen Domains erlaubt. Wird der Server
mit `NODE_ENV=production` gestartet, akzeptiert er nur noch Ursprünge mit der
Top-Level-Domain `.de`.

## Sicherheits-Header

Das Paket [Helmet](https://www.npmjs.com/package/helmet) setzt gängige
HTTP-Sicherheits-Header wie `X-Frame-Options`. Damit weiterhin externe
Schriftarten geladen werden können, ist `crossOriginEmbedderPolicy`
deaktiviert und der `Cross-Origin-Resource-Policy` Header auf
`cross-origin` gesetzt. So bleiben mobile Browser funktionsfähig.

## Formatierung und Linting

Das Projekt verwendet ESLint und Prettier zur Code-Qualität. Die folgenden Befehle stehen zur Verfügung:

```bash
npm run lint     # Code mit ESLint prüfen
npm run format   # Code mit Prettier formatieren
```
