# CoinSight

A professional cryptocurrency portfolio management dashboard built with React, Vite, and Tailwind CSS for real-time investment tracking and analytics.

## Description

CoinSight is a production-ready web application that enables cryptocurrency investors to monitor and analyze their portfolios in real-time. The platform integrates with CoinGecko API to fetch live market data, calculates portfolio metrics automatically, and provides comprehensive insights through interactive visualizations and intelligent notifications.

## Features

- Real-time cryptocurrency price tracking with automatic 60-second refresh intervals
- Portfolio management with buy/sell functionality and automatic cost averaging
- Comprehensive analytics including profit/loss tracking and performance metrics
- Interactive data visualizations with pie charts and historical performance comparisons
- Complete transaction history with detailed records and activity timeline
- Multi-currency support for USD, EUR, and INR with live exchange rates
- Portfolio health scoring with diversification analysis
- Smart insights and recommendations based on portfolio composition
- Notification system with configurable preferences
- Portfolio data export functionality
- Support for 40+ major cryptocurrencies

## Tech Stack

**Frontend Framework**
- React 18.3
- React Router DOM 6.21
- Tailwind CSS 3.4

**Data Visualization**
- Recharts 2.10

**Build Tools**
- Vite 6.0
- PostCSS & Autoprefixer

**State Management**
- React Context API
- LocalStorage for persistence

**External APIs**
- CoinGecko API (cryptocurrency data)
- ExchangeRate API (currency conversion)

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

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

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
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── charts/         # Data visualization components
│   ├── context/        # State management providers
│   ├── services/       # API integration layer
│   ├── utils/          # Helper functions and utilities
│   ├── layouts/        # Application layout wrappers
│   ├── App.jsx         # Root component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

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

### Settings & About
![Settings](./screenshots/settings.png)

## Admin Login (Prototype)

**Important:** This version uses frontend-only authentication for demonstration purposes.

**Login Credentials:**
- Email: `admin@coinsight.app`
- Password: `coinsight123`

**Security Notice:** This authentication is implemented for prototype demonstration only. Production deployment requires backend authentication, proper authorization, secure session management, and data encryption.

## Usage Guide

1. **Login** - Access the application using the provided credentials
2. **Dashboard** - View portfolio overview with analytics and market insights
3. **Add Holdings** - Click "Add Coin" to search and add cryptocurrencies
4. **Manage Positions** - Use "Buy" to increase holdings or "Sell" to liquidate positions
5. **Transaction History** - Track all portfolio activities with detailed records
6. **Settings** - Configure notifications and export portfolio data

## Browser Compatibility

- Google Chrome (recommended)
- Mozilla Firefox
- Safari
- Microsoft Edge

## Known Limitations

- CoinGecko free tier API rate limit: 50 calls/minute
- Historical data availability: 90 days maximum
- Data persistence: Browser localStorage (5-10MB limit)
- Frontend-only authentication (no backend)

## Future Roadmap

**Version 2.0 Planned Features:**
- Backend API with database integration
- User authentication and multi-user support
- Advanced charting with technical indicators
- Price alerts and threshold notifications
- Portfolio benchmarking and performance comparison
- CSV import for bulk transaction uploads
- Mobile application (React Native)
- WebSocket integration for real-time price updates
- Tax reporting and export functionality
- Exchange API integrations

## License

This project is licensed under the MIT License.

## Author

**Krishnik Barman**  
Email: krishnikbarman12@gmail.com  
GitHub: https://github.com/krishnikbarman

## Acknowledgments

This project was developed to demonstrate modern web application architecture, API integration patterns, state management techniques, and responsive UI design principles.

**APIs and Libraries:**
- [CoinGecko API](https://www.coingecko.com/en/api) - Cryptocurrency market data
- [ExchangeRate API](https://www.exchangerate-api.com/) - Currency conversion rates
- [Recharts](https://recharts.org/) - Data visualization library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React](https://reactjs.org/) - JavaScript UI library
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling

---

**CoinSight v1.0** - Professional Cryptocurrency Portfolio Management
