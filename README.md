# Uptime Monitor

Real-time website health monitoring dashboard built with **React + Vite + AWS Lambda**.

## Features

- 🟢 Monitor multiple websites simultaneously
- 📊 Live sparkline response time charts per site
- 🔒 SSL certificate validity & expiry tracking
- 🌍 Geo-location pinging (US, EU, Asia, etc.)
- 📥 Export ping history as CSV
- ⏸ Pause / resume individual monitors
- ⚡ Pings every 10 seconds, 30-min rolling window

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite, Tailwind CSS      |
| Charts   | Recharts                          |
| Backend  | AWS Lambda (Python)               |
| Routing  | AWS API Gateway                   |
| Hosting  | AWS S3 static website             |

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

## Deploy to S3

1. Run `npm run build`
2. Upload the contents of `dist/` to your S3 bucket
3. Enable Static Website Hosting on the bucket
4. Set index document to `index.html`

## Environment

The Lambda URL is set in `src/utils/api.js`. To change it:

```js
const LAMBDA_URL = 'https://your-api-gateway-url/ping-web/'
```

## Project Structure

```
src/
├── components/
│   ├── AddMonitorForm.jsx   # URL input + location selector
│   ├── GlobalStats.jsx      # Top-level stats bar
│   ├── MonitorCard.jsx      # Per-site card with metrics
│   ├── PingLog.jsx          # Expanded detail view
│   └── SparklineChart.jsx   # Mini response time chart
├── hooks/
│   └── useMonitor.js        # All ping logic & state
├── utils/
│   └── api.js               # Lambda calls & helpers
├── App.jsx
├── main.jsx
└── index.css
```
