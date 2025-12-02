# SalesPredictor Documentation

## 1. System Overview
- **Purpose**: Full-stack sales forecasting, inventory management, and market-basket analysis platform for multi-role retail teams.
- **Architecture**: MERN-style backend (`backend/`) built with Express + MongoDB, coupled with a Vite/React/TypeScript frontend (`frontend/`). Predictive analytics and market-basket mining run via Python scripts orchestrated from Node.js.
- **Key Capabilities**:
  - Role-based authentication and session management.
  - Sales ingestion (manual or CSV upload) with validation and reporting.
  - Forecast generation via ARIMA or RandomForest-based pipelines.
  - Market-basket analysis using Apriori rules.
  - PDF/CSV report generation (sales, inventory, forecast, performance).
  - Rich dashboard with charts, filters, and CRUD flows for products, sales, reports, forecasts, and users.

## 2. Technology Stack
| Area | Technologies |
| --- | --- |
| Backend | Node.js, Express, Mongoose, JWT, Multer, csv-parser/fast-csv, json2csv, pdfkit/pdfmake, node-cron, redis |
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form + Zod, Tailwind, Shadcn UI (Radix primitives), Chart.js/Recharts |
| Analytics | Python 3 (pandas, numpy, scikit-learn, statsmodels, mlxtend), orchestrated via `python-shell` |
| Tooling | ESLint, Nodemon, Winston logging, Swagger UI |

## 3. Repository Layout
```
backend/              Express API, Mongo models, controllers, scripts
  config/             DB/redis connections, cron scheduler, Swagger setup
  controllers/        Domain logic (auth, sales, forecast, reports, etc.)
  middleware/         Auth, role-based ACL, sanitization, error handler
  models/             Mongoose schemas: User, Product, Sale, Forecast, ...
  routes/             API routers mounted under `/api`
  scripts/            Python ML pipelines + requirements
  utils/              Logger, email, validation helpers
frontend/             Vite React app
  src/
    components/       Shared UI (Shadcn-based), layout, auth guards
    context/          Auth + Theme contexts
    hooks/            Utilities (debounce, pagination, etc.)
    pages/            Route-level views (dashboard, sales, products, ...)
    services/         Axios-powered API clients per resource
    types/, utils/    Shared TS types and helpers
PROJECT_ANALYSIS.md   Prior notes
PROJECT_DOCUMENTATION.md (this file)
```

## 4. Backend Architecture

### 4.1 Server Bootstrap
- `backend/server.js` loads env vars, connects Mongo via `config/db.js`, applies security middleware (`cors`, `helmet`, rate limiting, JSON parsers), serves static reports, mounts `/api` routes (`routes/index.js`), exposes Swagger docs, and centralizes error handling.

### 4.2 Configuration & Infrastructure
- `config/db.js`: resilient async connection with SSL awareness, connection event logging, and user-facing tips if `MONGO_URI` missing.
- `config/redis.js`: optional Redis client using `REDIS_URL`; errors logged.
- `config/cron.js`: schedules weekly retraining by calling `forecastAdminController.retrainForecast`.
- `config/swagger.js` + `swagger.yaml`: composes OpenAPI docs served at `/api-docs`.

### 4.3 Data Models (`backend/models`)
- `User`: username/email/password/role (Manager, Planner, Owner, Admin) with timestamps.
- `Product`: catalog info, stock levels, thresholds, categorization, last restock.
- `Sale`: references `User`, includes line items (`productId`, quantity, price) plus promotion flags.
- `Forecast`: stores prediction arrays, metadata (period/model), feature flags, metrics (RMSE/MAE/MAPE), alert status.
- `MarketBasket`: captures analysis parameters (support/confidence), frequent itemsets, and association rules.
- `Report`: audit of generated files (type, format, date range, path).

### 4.4 Middleware
- `middleware/auth.js`: validates JWT `Authorization` header, decodes to `req.user`.
- `middleware/role.js`: guards routes by role, always allows `Owner`.
- `middleware/sanitize.js`: wraps `express-mongo-sanitize` + `xss-clean`.
- `middleware/errorHandler.js`: consistent JSON error responses, logs via Winston.

### 4.5 Controllers & Routes
| Domain | Route Base | Highlights |
| --- | --- | --- |
| Auth (`controllers/authController.js`) | `/api/auth` | Register/login/update profile, password hashing, JWT issue. |
| Users (`controllers/userController.js`) | `/api/users` | Role-protected CRUD for user management. |
| Products (`controllers/productController.js`, `productAdminController.js`) | `/api/products`, `/api/productadmin` | Inventory CRUD, threshold updates, admin imports. |
| Sales (`controllers/saleController.js`) | `/api/sales` | CRUD, CSV uploads via Multer (`uploads/`), pagination/filtering, validation with `express-validator`. |
| Forecasts (`controllers/forecastController.js`, `forecastAdminController.js`) | `/api/forecasts`, `/api/forecastadmin` | Forecast generation, listing, settings updates, retraining, metrics tracking. |
| Market Basket (`controllers/marketBasketController.js`) | `/api/marketbasket` | Launches Apriori analysis, stores itemsets & rules. |
| Reports (`controllers/reportController.js`) | `/api/reports` | Generates PDF/CSV for sales, forecast, inventory, performance; persists metadata. |

Routes are declared under `backend/routes/` with Swagger annotations, express-validator chains, Multer uploads, and middleware stacking.

### 4.6 Forecasting Pipeline
1. `forecastController.generateForecast` fetches >=10 historical `Sale` docs for the requesting user, validates dates/model selection, and shapes JSON-friendly series.
2. Calls `scripts/forecast.py` via `python-shell` with retries, 30s timeout, and structured stdout parsing. Errors (JSON or stderr) propagate to API response.
3. Python script:
   - Loads sales into pandas, aggregates by requested frequency (Daily/Weekly/Monthly).
   - Builds features (lags, rolling stats, promotion flags) and detects seasonality.
   - Trains ARIMA (with optional `pmdarima.auto_arima`) or RandomForestRegressor, stepping future predictions.
   - Computes metrics (RMSE/MAE/MAPE) and returns predictions + metadata as JSON.
4. Controller validates/normalizes predictions, saves `Forecast` doc, toggles alerts when `MAPE > 20`, and responds to client.

Admin retraining (`forecastAdminController.retrainForecast`) uses similar flow but targets broader datasets and is callable via cron.

### 4.7 Market-Basket Analysis
- `marketBasketController` gathers recent sales (with populated items), invokes `scripts/marketBasket.py`.
- Python script builds transaction dataframe, one-hot encodes items, runs Apriori from `mlxtend`, generates frequent itemsets and association rules (support/confidence/lift).
- Results stored in `MarketBasket` documents for later visualization.

### 4.8 Reporting & File Generation
- `reportController.generateReport` supports `Sales`, `Forecast`, `Inventory`, `Performance` types and `csv`/`pdf` formats.
- CSV: `json2csv` parser writes to `backend/reports/`.
- PDF: `pdfkit` + custom layout helpers (`addTableToPDF`, `addHeaderFooter`) create branded sections (metrics, top products, daily sales, etc.).
- Generated files recorded in `Report` model; static serving via `/reports/<filename>`.

### 4.9 Logging, Validation, and Uploads
- Winston logger writes to `logs/error.log` + `logs/combined.log` and console, used throughout controllers.
- Input validation via `express-validator` ensures numeric bounds, dates, enumerations.
- File uploads (sales CSV) handled by Multer to `backend/uploads/` (hashed filenames); controllers parse and persist records.

## 5. Frontend Architecture

### 5.1 Application Shell
- Entry at `frontend/src/main.tsx` renders `<App />` into `index.html`.
- `App.tsx` sets up `BrowserRouter`, `AuthProvider`, `ThemeProvider`, React Query client, and global Toasts; routes feed into `MainLayout` (header + sidebar) via `ProtectedRoute`.

### 5.2 State Management & Data Fetching
- `src/services/api.ts` wraps Axios with base URL, auth token injection, 401 handling, file upload/download helpers.
- Domain services (`salesService`, `forecastService`, etc.) expose typed methods consumed by hooks/pages.
- TanStack Query drives data loading, caching, and refetch flows across dashboard, sales, forecasts, etc.
- Auth context (`context/AuthContext.tsx`) maintains `user`, `token`, loading states, and exposes `login/register/logout`.

### 5.3 Routing & Guards
- `components/auth/ProtectedRoute.tsx`: redirects unauthenticated users to login.
- `components/auth/RoleRoute.tsx`: restricts certain UI/actions to specified roles (Owner bypass).
- `pages/auth/Login.tsx` / `Register.tsx`: React Hook Form + Zod validation for credentials.

### 5.4 UI Components & Styling
- Shadcn-inspired components under `components/ui/` (Button, Card, Dialog, Tabs, DateRangePicker, etc.) styled with Tailwind.
- Layout components (`components/layout/Header.tsx`, `Sidebar.tsx`) manage navigation, theme toggles, profile menus.
- `ThemeContext.tsx` toggles light/dark; `App.css`, `index.css`, Tailwind config tune global styles.
- `components/dashboard/*` encapsulate Chart.js/Recharts visualizations (SalesChart, ForecastChart, MarketBasketChart).

### 5.5 Feature Pages (selected)
- `pages/Dashboard.tsx`: aggregates sales, forecasts, and market-basket insights into metric cards and tabbed charts; uses motion animations and skeletons for loading.
- `pages/sales/*`: filters, paginated table, modal form (`SaleForm.tsx`) with create/edit, CSV upload dialog (`SalesUpload.tsx`), and details view.
- `pages/forecasts/*`: request new forecasts, list historical runs, inspect metrics/confidence bands, adjust settings.
- `pages/marketBasket/*`: trigger analyses, inspect itemsets/rules, visualize via network charts.
- `pages/reports/*`: request/generate/download PDF/CSV reports; integrate with `reportService`.
- `pages/products/*`, `pages/users/*`, `pages/settings/*`: CRUD management, profile updates, notification preferences, etc.
- `pages/ForbiddenPage.tsx` / `NotFound.tsx`: friendly error states.

### 5.6 Forms, Types, and Utilities
- Forms rely on React Hook Form + `@hookform/resolvers/zod` for type-safe validation.
- Shared TS definitions in `src/types/` (e.g., `types/sale.ts`, `types/forecast.ts`) align with backend schema shapes.
- Utility hooks (`useDebounce`, `usePagination`, `useIsMobile`, `useLocalStorage`, `useClickOutside`) support responsive UX.

## 6. Core Data Flows
1. **Authentication**
   - User registers/logs in via `/api/auth`; tokens stored in localStorage.
   - `ProtectedRoute` gatekeeps routes; `RoleRoute` conditions actions.
2. **Sales Ingestion**
   - Manual entry (`SaleForm`) or CSV upload hitting `/api/sales/upload`; backend parses, validates, and persists `Sale` + `Product` relations.
   - List view fetches paginated data with filters; dashboard aggregates to charts.
3. **Forecast Generation**
   - Frontend posts model/period/date range to `/api/forecasts`.
   - Backend validates, fetches historical sales, executes Python pipeline, stores `Forecast`.
   - Results show in dashboard, forecasts pages, and can drive alerts.
4. **Market-Basket Analysis**
   - Triggered via `/api/marketbasket`; Node sends sales items to Python Apriori script, stores `MarketBasket`.
   - UI visualizes top itemsets/rules.
5. **Reporting**
   - Users request report type + date range via `/api/reports`.
   - Server compiles data, emits PDF/CSV, logs `Report` entry.
   - Frontend downloads via `reportService.downloadReport`.

## 7. Environment & Setup

### Backend `.env` (sample)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/sales-forecast
JWT_SECRET=replace-me
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your@gmail.com
EMAIL_PASS=app-password
REDIS_URL=redis://localhost:6379
```

**Install & run**
```bash
cd backend
npm install
npm run dev         # nodemon
npm run swagger     # optional, regenerates docs
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

**Install & run**
```bash
cd frontend
npm install
npm run dev         # Vite dev server on :5173
npm run build       # production bundle
```

Ensure Python 3.x plus requirements (`backend/scripts/requirements.txt`) are installed in the environment accessible as `python`.

## 8. Quality, Logging, and Testing
- **Logging**: Winston logger centralizes structured logs with timestamps, writing to file + console; Python scripts print step markers to aid troubleshooting.
- **Validation**: `express-validator` + Mongoose schema constraints + sanitization middleware guard backend inputs; frontend forms use Zod schemas.
- **Error Handling**: Global Express `errorHandler` formats JSON responses; interceptors on Axios clear tokens on 401.
- **Testing**: `backend/scripts/test_forecast.py` offers reproducible forecast script checks; frontend/back scripts rely on linting and TypeScript type-checks (`npm run lint`, `npm run type-check`).
- **Monitoring Hooks**: Cron job for weekly retraining; Redis stub ready for caching or queues if `REDIS_URL` provided.

## 9. Deployment Considerations
- **Backend**: Build Node service (PM2, Docker, etc.), ensure MongoDB/Redis resources, configure environment variables, expose `/reports` for static downloads, schedule cron via `config/cron.js` (invoke from server bootstrap if desired).
- **Frontend**: `npm run build` (Vite) outputs static assets ready for CDN or SPA hosting; configure reverse proxy for `/api` and `/reports`.
- **Security**: Serve over HTTPS, rotate JWT secret, restrict CORS origins, store email/Redis credentials securely, enforce file upload limits (already set to 10MB in frontend and validated server-side).

## 10. Extensibility & Next Steps
- Integrate Redis caching for heavy analytics or session storage.
- Expand automated tests (Jest for backend, Vitest/RTL for frontend).
- Enhance alerting (email via `utils/email.js`) when forecasts exceed error thresholds or inventory drops below `lowStockThreshold`.
- Add CI/CD pipelines leveraging existing lint/build scripts.
- Internationalize UI text and add accessibility audits for dashboard components.

For deeper dives into specific modules, refer to the file paths noted above or leverage the Swagger UI at `/api-docs` for live endpoint exploration.

