# bizplanevaluator-20250622_123118

> **Node.js Application**  
> Backend API for AI-powered business-plan evaluation, market research aggregation, financial projections, plan generation, report export, and subscription-based billing.

Project documentation: https://docs.google.com/document/d/1Tx9u_kedioW6918ti7MGuJl8Hw3TzC05vxBV19dQDSM/

---

## Table of Contents

- [Overview](#overview)  
- [Architecture](#architecture)  
- [Flow](#flow)  
- [Features](#features)  
- [File Structure & Components](#file-structure--components)  
- [Installation](#installation)  
- [Configuration](#configuration)  
- [Usage Examples](#usage-examples)  
- [Dependencies](#dependencies)  
- [Missing UI & Future Work](#missing-ui--future-work)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Overview

BizPlanEvaluator is a RESTful Node.js/Express application providing a rich set of backend services for:

- AI-driven SWOT, TAM & competition analysis  
- Market data aggregation & normalization  
- Financial projections (revenue, expenses, cashflow)  
- Automated business-plan generation  
- PDF/Excel export of reports  
- Subscription billing & feature-flag management  

> **Note:** This repo currently contains **server-side code only**. There is no client/UI implementation yet.

---

## Architecture

1. **server.js**  
   - Loads environment variables  
   - Boots the HTTP/S server  
2. **initializeserver.js**  
   - Creates Express app  
   - Registers middleware  
   - Mounts routes  
3. **Middleware Chain** (in order)  
   - `loggermiddleware.js` ? request/response logging  
   - `authmiddleware.js` ? JWT/session verification  
   - `featureflagservice.js` ? gated/premium feature checks  
   - `errorhandlermiddleware.js` ? error catching & formatting  
4. **Routes** (defined in `setuproutes.js`)  
   - `/api/analysis`, `/api/market`, `/api/finance`, `/api/plan`, `/api/report`, `/api/billing`  
5. **Service Layer**  
   - **AIAnalysisService** (`aianalysisservice.js`)  
   - **MarketDataAggregator** (`marketdataaggregator.js`)  
   - **FinancialProjectionEngine** (`financialprojectionengine.js`)  
   - **BusinessPlanGenerator** (`businessplangenerator.js`)  
   - **ReportExporter** (`reportexporter.js`)  
   - **BillingService** (`billingservice.js`)  
   - **FeatureFlagService** (`featureflagservice.js`)  

---

## Flow

1. Client issues HTTP request to an API endpoint.  
2. `server.js` ? `initializeserver.js` sets up Express app.  
3. Request passes through middlewares (logging ? auth ? feature flags).  
4. `setuproutes.js` dispatches to route handlers.  
5. Handlers call service modules to perform work (AI calls, data fetch, projection).  
6. `reportexporter.js` streams PDF/Excel back to the client.  
7. `billingservice.js` processes Stripe/PayPal operations & webhooks.  
8. Errors bubble up to `errorhandlermiddleware.js` for uniform responses.

---

## Features

- Secure authentication (JWT/session)  
- AI-driven SWOT, TAM & competition analysis  
- Aggregated market research from third-party APIs  
- Advanced financial projection engine  
- Automated business-plan composition  
- PDF & Excel report exports  
- Stripe & PayPal subscription billing  
- Feature-flag management for gated features  
- Centralized logging & resilient error handling  

---

## File Structure & Components

```text
.
??? server.js
??? initializeserver.js
??? setuproutes.js
??? authmiddleware.js
??? loggermiddleware.js
??? errorhandlermiddleware.js
??? featureflagservice.js
??? aianalysisservice.js
??? marketdataaggregator.js
??? financialprojectionengine.js
??? businessplangenerator.js
??? reportexporter.js
??? billingservice.js
??? package.json
```

Component details:

- **server.js**  
  Entry point; loads config & starts HTTP server. *(Status: Fail ? needs implementation)*

- **initializeserver.js**  
  Initializes Express app, middleware & route mounting.

- **setuproutes.js**  
  Binds API endpoints to their handlers.

- **authmiddleware.js**  
  Validates JWT or session tokens; populates `req.user`.

- **loggermiddleware.js**  
  Logs incoming requests & response times.

- **errorhandlermiddleware.js**  
  Catches exceptions & formats error responses.

- **featureflagservice.js**  
  Fetches & evaluates feature flags for rollout control.

- **aianalysisservice.js**  
  Orchestrates OpenAI calls for SWOT, TAM & competition analysis.

- **marketdataaggregator.js**  
  Fetches external market/competitor data, normalizes & caches.

- **financialprojectionengine.js**  
  Calculates revenue, expense & cashflow projections.

- **businessplangenerator.js**  
  Assembles structured business-plan outlines with recommendations.

- **reportexporter.js**  
  Generates PDF/Excel documents and returns download URLs.

- **billingservice.js**  
  Integrates Stripe & PayPal; handles subscription lifecycle & webhooks.

---

## Installation

```bash
# Clone the repo
git clone https://github.com/your-org/bizplanevaluator-20250622_123118.git
cd bizplanevaluator-20250622_123118

# Install dependencies
npm install
```

---

## Configuration

Create a `.env` file in the project root:

```ini
PORT=3000
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
REDIS_URL=redis://localhost:6379
```

Or use environment variables directly.

---

## Usage Examples

Start the server:

```bash
npm start
```

Sample requests:

1. **Health Check**

```bash
curl http://localhost:3000/health
```

2. **AI Analysis**

```bash
curl -X POST http://localhost:3000/api/analysis \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"industry":"fintech","market":"global","revenueModel":"subscription"}'
```

3. **Generate Business Plan**

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ideaId":"abc123"}'
```

4. **Export Report (PDF)**

```bash
curl http://localhost:3000/api/report/pdf?planId=abc123 \
  -H "Authorization: Bearer <token>" -o plan.pdf
```

5. **Create Subscription**

```bash
curl -X POST http://localhost:3000/api/billing/subscribe \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro"}'
```

---

## Dependencies

Key packages in `package.json`:

- express  
- jsonwebtoken  
- openai  
- stripe  
- paypal-rest-sdk  
- pdfkit  
- exceljs  
- node-fetch  
- redis  
- config  
- dotenv  

---

## Missing UI & Future Work

This repository does **not** include any client-side UI:

- No React/Vue/Angular code  
- No HTML templates or static assets  
- No CSS or styling files  
- No dashboard, sidebar, or subscription modals  

**Recommendations:**  
- Add a `client/` directory with an SPA (React, Vue) or server-rendered templates.  
- Define common UI components (Sidebar, Navbar, Dashboard).  
- Integrate a bundler (Webpack, Vite) and styling (CSS/SCSS).  

---

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feat/my-feature`)  
3. Commit your changes (`git commit -m "Add my feature"`)  
4. Push to your branch (`git push origin feat/my-feature`)  
5. Open a Pull Request  

Please follow conventional commit messages and ensure all tests pass.

---

## License

Distributed under the MIT License. See `LICENSE` for details.