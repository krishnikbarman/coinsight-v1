# CoinSight v1.2 – Real-Time Crypto Portfolio & Market Intelligence Dashboard 🚀

A professional cryptocurrency portfolio management dashboard with real-time tracking, Supabase backend, smart price alerts, market intelligence, and CSV export. Built with modern web technologies and enterprise-grade security.

## Overview

CoinSight empowers cryptocurrency investors to monitor, analyze, and manage their portfolios with real-time market data and intelligent features. The platform leverages Supabase for backend and database, integrates live crypto APIs, and offers advanced analytics, smart price alerts, and seamless CSV export.

## Features

### Portfolio Management
- Buy / Sell crypto
- Transaction history
- Real-time valuation

### Smart Price Alerts (NEW v1.2) 🔔
- Above / Below alerts
- Instant trigger detection
- Active / Triggered status
- Notification integration
- Toggle enable / disable

### Market Section (NEW v1.2) 📈
- Top 10 cryptocurrencies only
- Live market overview
- Coin search
- Universal coin details modal
- Price alert from market coins

### Data Export (NEW v1.2) 📤
- Export portfolio & transactions to CSV from database

### Notifications
- Portfolio updates
- Price alert triggers

### Authentication
- Supabase Auth
- Secure login

### Additional Highlights
- Real-time Portfolio Tracking (auto-refresh)
- Supabase Cloud Storage & Database
- Admin Authentication (role-based)
- Transaction History & Audit Trail
- Portfolio Analytics: Profit/loss, diversification, health scoring
- Secure Row-Level Security (RLS)
- Cloud Synced Settings
- Multi-Currency Support (USD, EUR, INR)
- Interactive Visualizations
- 40+ Cryptocurrencies Supported

## Tech Stack

**Frontend**
- React 18.3
- Vite 6.0
- Tailwind CSS 3.4

**Backend**
- Supabase (Backend & Database)
- PostgreSQL (Supabase)
- Row-Level Security (RLS)

**Authentication**
- Supabase Email/Password

**Data Visualization**
- Recharts 2.10

**State Management**
- React Context API
- React Router DOM 6.21

**External APIs**
- CoinGecko API (Real-time crypto data)
- ExchangeRate API (Live currency rates)

## Architecture

CoinSight follows a modern three-tier architecture:

### Frontend Layer
- React Components & Hooks
- Context Providers (auth, portfolio, notifications)
- Service Layer abstraction

### Backend Layer
- Supabase Client (`/supabase/client.js`)
- Supabase Auth (email/password)
- API Services (portfolio, transactions, crypto, currency)

### Database Layer
- PostgreSQL Tables:
  - `profiles` (user metadata)
  - `holdings` (portfolio positions)
  - `transactions` (history)
  - `portfolio_snapshots` (daily value)
- Row-Level Security (RLS)
- Foreign Keys

### Data Flow
```
User Action → React Component → Service Layer → Supabase Client → PostgreSQL
                                      ↓
                            External APIs (CoinGecko, ExchangeRate)
```

### LocalStorage Usage
CoinSight uses localStorage only for:
- **Supabase Auth Session** - Session tokens managed by Supabase SDK
- **One-Time Migration Flag** - Tracks if localStorage data has been migrated to Supabase
- **Reset App Feature** - Clears local cache when user resets application

All portfolio data is stored in Supabase PostgreSQL database.

## Installation

### Prerequisites

Ensure you have the following installed:
- Node.js v18 or higher
- npm or yarn package manager

### Steps

1. Clone the repository:
```bash
git clone https://github.com/krishnikbarman/coinsight-v1.git
cd coinsight
```

2. Install dependencies:
```bash
npm install
```

3. Configure Supabase:
   
   a. Create a free account at [https://supabase.com](https://supabase.com)
   
   b. Create a new project
   
   c. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   d. Get your credentials from Project Settings > API:
      - Copy the Project URL
      - Copy the anon/public key
   
   e. Update `.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

   f. Run the database schema from `supabase-schema.sql` in the Supabase SQL Editor

4. Start the development server:
```bash
npm run dev
```

5. Open your browser at `http://localhost:5173`

6. Register a new account to start tracking your portfolio

## Run Locally

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:5173` with hot module replacement enabled.

### Production Build

```bash
npm run build
```

Optimized files will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
coinsight/
├── public/              # Static assets
├── screenshots/         # Application screenshots
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── charts/         # Data visualization components
│   ├── context/        # Context providers (Auth, Portfolio, Notifications)
│   ├── services/       # API integration (portfolio, transaction, crypto, currency)
│   ├── supabase/       # Supabase client configuration
│   ├── utils/          # Helper functions and calculations
│   ├── layouts/        # Layout wrappers (App, Auth)
│   ├── config/         # Configuration files
│   ├── App.jsx         # Root component with routing
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles and Tailwind directives
├── .env.example        # Environment variables template
├── supabase-schema.sql # Database schema and RLS policies
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Deployment

CoinSight is deployment-ready and works seamlessly on modern hosting platforms:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the dist/ folder via Netlify dashboard or CLI
```

**Environment Variables**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in your hosting platform's environment settings.

## Screenshots

### Login Page
![Login](./screenshots/login.png)

### Dashboard Overview
![Dashboard](./screenshots/dashboard.png)

### Portfolio Page
![Portfolio](./screenshots/portfolio.png)

### Transaction History
![Transactions](./screenshots/transactions.png)

### Notifications Panel
![Notifications](./screenshots/notifications.png)

### Market Page
![Market](./screenshots/market.png)

### Price Alerts Page
![Price Alerts](./screenshots/price-alerts.png)

### Settings & About
![Settings](./screenshots/settings.png)

## Authentication

CoinSight uses Supabase for secure, production-grade authentication.

**Registration:**
1. Navigate to the login page
2. Click the "Register" tab
3. Enter email and password (minimum 6 characters)
4. Confirm email if required by your Supabase settings

**Login:**
- Use registered email and password
- Sessions persist across browser refreshes
- Automatic token refresh

**Security Features:**
- Passwords hashed and stored securely by Supabase
- JWT-based session tokens
- Protected routes with automatic redirects
- Role-based access control for admin features

## Usage Guide

1. **Register/Login** - Create account or sign in with credentials
2. **Dashboard** - View portfolio overview with real-time analytics and insights
3. **Add Holdings** - Click "Add Coin" to search and add cryptocurrencies to your portfolio
4. **Buy/Sell** - Manage positions with automatic cost averaging calculations
5. **Transaction History** - Review complete audit trail of all operations
6. **Notifications** - Configure alerts for price changes and portfolio events
7. **Settings** - Customize preferences, currency, and export portfolio data

## Browser Compatibility

- Google Chrome (recommended)
- Mozilla Firefox
- Safari
- Microsoft Edge

## Version History

**v1.0 – LocalStorage Prototype**
- Client-side portfolio tracking
- LocalStorage data persistence
- Basic authentication simulation
- Real-time market data integration

**v1.1 – Supabase Backend Migration**
- Migrated to Supabase backend infrastructure
- PostgreSQL database with RLS policies
- Secure email/password authentication
- Cross-device portfolio synchronization
- Transaction history persistence
- Cloud-based settings storage
- Automatic localStorage to Supabase migration
- Production-ready architecture

**v1.2 – Real-Time Smart Alerts & Market Intelligence**
- Smart price alerts (Above/Below)
- Instant trigger detection
- Active/Triggered status
- Notification integration
- Market section with top 10 coins
- Data export to CSV
- Real-time portfolio tracking

## Known Limitations

- CoinGecko free tier: 50 API calls per minute
- Historical data: 90-day maximum range
- Email confirmation may be required based on Supabase project settings

## Future Roadmap

- Advanced charting with technical indicators
- Price alerts and threshold notifications
- Portfolio benchmarking against market indices
- CSV import for bulk transaction uploads
- Tax reporting and export functionality
- Exchange API integrations for automatic sync
- Mobile application (React Native)
- WebSocket integration for real-time updates

## License

This project is licensed under the MIT License.

## Author

**Krishnik Barman**  
Email: krishnikbarman12@gmail.com  
GitHub: https://github.com/krishnikbarman

## Acknowledgments

Built with industry-leading technologies and APIs:

- [Supabase](https://supabase.com/) - Backend infrastructure and authentication
- [CoinGecko API](https://www.coingecko.com/en/api) - Cryptocurrency market data
- [ExchangeRate API](https://www.exchangerate-api.com/) - Currency conversion
- [Recharts](https://recharts.org/) - Data visualization
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool

---

**CoinSight v1.2** - Professional Crypto Portfolio Analyzer with Cloud Backend
