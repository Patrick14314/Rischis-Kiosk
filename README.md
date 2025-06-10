# Rischis Kiosk Backend

Eine kleine Express-Anwendung zur Verwaltung eines digitalen Kiosks. Die Anwendung nutzt Supabase als Datenbank.

Zusätzlich enthält das Repository ein Multiplayer-Buzzer-Spiel, das ebenfalls Supabase zur Echtzeit-Synchronisation verwendet. Der Server stellt hierfür unter `/api/buzzer` diverse Endpunkte bereit.

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

| Variable                | Beschreibung                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| `SUPABASE_URL`          | URL Ihres Supabase Projekts                                       |
| `SUPABASE_SERVICE_ROLE` | Service Role Key von Supabase                                     |
| `PORT`                  | Port, auf dem der Server läuft (optional)                         |
| `COOKIE_DOMAIN`         | Domain für Cookies (optional)                                     |
| `COOKIE_SECURE`         | `true` erzwingt Secure-Cookies                                    |
| `COOKIE_SAMESITE`       | Wert für das SameSite-Attribut                                    |
| `FORCE_HTTPS`           | `true` leitet HTTP-Anfragen auf HTTPS um                          |
| `NODE_ENV`              | Bei `production` werden nur Anfragen von `.de` Domains zugelassen |
| `BANK_USER_NAME`        | Name des System-Users für Buzzer-Auszahlungen und Poker-Gewinne (optional). Muss exakt dem Wert in `users.name` entsprechen |

**Hinweis:** Wenn der Server lediglich per HTTP erreichbar ist (beispielsweise bei lokalen Tests), muss `COOKIE_SECURE=false` gesetzt sein. Andernfalls wird das Session-Cookie nicht übertragen und Sie werden beim Seitenwechsel ausgeloggt.

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

## Formatierung und Linting

Das Projekt verwendet ESLint und Prettier zur Code-Qualität. Die folgenden Befehle stehen zur Verfügung:

```bash
npm run lint     # Code mit ESLint prüfen
npm run format   # Code mit Prettier formatieren
```

## Tools

Neben Linting und Formatierung stehen noch weitere npm-Skripte zur
Verfügung, die den Entwicklungsalltag erleichtern:

```bash
npm start        # Express-Server starten
npm test         # Tests ausführen (Platzhalter)
npm run lint     # Code mit ESLint prüfen
npm run format   # Code mit Prettier formatieren
```

## Buzzer-Spiel

Das Buzzer-Spiel ermöglicht schnelle Musikquiz-Runden. Es nutzt Supabase für Authentifizierung, Datenbankzugriffe und Realtime-Channels.

### Features

- **Rundenverwaltung** durch einen Admin
- **Echtzeit-Buzzern** und Skippen – nur der erste Buzz zählt
- Punktevergabe manuell durch den Admin
- Verteilung des Einsatzes: 95 % an Gewinner, 5 % an Bank

### API-Endpunkte (Auszug)

- `GET /api/buzzer/round` – aktive Runde abrufen
- `POST /api/buzzer/round` – neue Runde starten (Admin)
- `POST /api/buzzer/round/end` – laufende Runde beenden (Admin)
- `POST /api/buzzer/join` – aktueller Runde beitreten
- `POST /api/buzzer/buzz` – im laufenden KOLO buzzern
- `POST /api/buzzer/skip` – Buzz überspringen
- `POST /api/buzzer/kolo` – neues KOLO starten (Admin)
- `POST /api/buzzer/kolo/end` – KOLO beenden und werten (Admin)

Weitere Details zum kompletten Ablauf finden sich in [docs/buzzer_flow.md](docs/buzzer_flow.md).

## Zock Royale

Zock Royale ist ein kleines Spaß-Pokerspiel. Über `/api/poker/play` kannst du
einen Einsatz platzieren. In 35 % der Fälle verdoppelt sich dein Einsatz, in
5 % gibt es sogar das Vierfache als Jackpot. Verlierst du, landet der Einsatz
auf dem Konto, das in `BANK_USER_NAME` hinterlegt ist (in der Regel der
„Haus“-Account). Gewinnt der Spieler, wird ihm der Gewinn aus dem Guthaben des
Haus-Kontos ausgezahlt. Somit hat das Haus eine Gewinnchance von 60 %. Das
Ergebnis wird im Nutzerkonto gespeichert. Eine humorvolle Anleitung findest du
unter [docs/zock_royale_anleitung.md](docs/zock_royale_anleitung.md).
