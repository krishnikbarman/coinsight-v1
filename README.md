# CoinSight

A professional cryptocurrency portfolio management dashboard built with React, Vite, and Tailwind CSS. Track your crypto investments in real-time with live market data, comprehensive analytics, and an intuitive user interface.

## Overview

CoinSight is a production-ready web application designed to help cryptocurrency investors monitor and analyze their portfolios. The platform fetches real-time price data from CoinGecko API, calculates portfolio metrics automatically, and provides actionable insights through visual analytics and intelligent notifications.

## Features

**Portfolio Management**
- Add and manage cryptocurrency holdings with aggregated position tracking
- Buy and sell functionality with automatic position averaging
- Real-time price updates with automatic refresh every 60 seconds
- Support for 40+ major cryptocurrencies

**Analytics & Insights**
- Live portfolio valuation with profit/loss tracking
- Performance metrics for individual holdings and overall portfolio
- Best and worst performer identification
- Portfolio health scoring with diversification analysis
- Smart insights based on portfolio composition

**Data Visualization**
- Interactive pie chart for portfolio distribution
- Historical performance comparison charts (Portfolio vs BTC vs ETH)
- Market trend visualization with 7-day, 30-day, and 90-day views

**Transaction Management**
- Complete transaction history with timestamps
- Buy and sell transaction records
- Portfolio activity timeline

**Notifications System**
- Real-time notifications for portfolio updates
- Notification center with read/unread status
- Configurable notification preferences

**Multi-Currency Support**
- USD, EUR, and INR display options
- Real-time exchange rate conversion
- Persistent currency preference

**Settings & Data Management**
- Portfolio data export functionality
- Account reset and data cleanup
- Notification preference management

## Tech Stack

**Frontend**
- React 18.3 - UI library
- React Router DOM 6.21 - Client-side routing
- Tailwind CSS 3.4 - Utility-first styling
- Recharts 2.10 - Data visualization

**Build & Development**
- Vite 6.0 - Build tool and dev server
- PostCSS & Autoprefixer - CSS processing

**APIs & Services**
- CoinGecko API - Real-time cryptocurrency data
- ExchangeRate API - Currency conversion rates

**State Management**
- React Context API - Global state management
- LocalStorage - Data persistence

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route-level page components
├── charts/             # Data visualization components
├── context/            # State management providers
├── services/           # External API integrations
├── utils/              # Helper functions and utilities
└── layouts/            # Application layout wrappers
```

## Screenshots

*Coming Soon* - Application screenshots will be added here.

## Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn package manager

### Local Development

1. Clone the repository
```bash
git clone <repository-url>
cd CryptoPortfolio
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Production Build

```bash
npm run build
```

The production-ready files will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Deploying to Vercel

1. Install Vercel CLI
```bash
npm install -g vercel
```

2. Deploy the application
```bash
vercel
```

3. Follow the prompts to complete deployment

### Deploying to Netlify

1. Build the application
```bash
npm run build
```

2. Deploy the `dist/` folder using Netlify CLI or drag-and-drop on netlify.com

### Environment Configuration

No environment variables are required for basic functionality. The application uses public APIs that don't require API keys.

## Admin Access

**Note:** This is a prototype version with frontend-only authentication.

**Login Credentials:**
- Email: `admin@coinsight.app`
- Password: `coinsight123`

**Security Notice:** This authentication is for demonstration purposes only. For production deployment with real user data, implement proper backend authentication, authorization, and data encryption.

## Usage

1. **Login** - Access the application using the admin credentials
2. **Dashboard** - View portfolio overview, analytics, and market insights
3. **Add Holdings** - Click "Add Coin" to search and add cryptocurrencies to your portfolio
4. **Buy More** - Use the "Buy" action to add to existing positions (automatically averages cost basis)
5. **Sell Holdings** - Use the "Sell" action to partially or fully liquidate positions
6. **View History** - Access transaction history from the sidebar navigation
7. **Configure Settings** - Manage notifications and export data from the Settings page

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Known Limitations

- CoinGecko free tier API has rate limits (50 calls/minute)
- Historical data limited to 90 days
- Data persistence uses browser localStorage (max 5-10MB)

## Future Roadmap (v2.0)

- Backend integration with user authentication
- Multi-user support with secure data storage
- Advanced charting with technical indicators
- Price alerts and threshold notifications
- Portfolio performance benchmarking
- CSV import for bulk transaction uploads
- Mobile application (React Native)
- Real-time WebSocket price updates
- Tax reporting and export
- API integrations with major exchanges

## License

This project is licensed under the MIT License.

## Author

Developed as a portfolio project to demonstrate modern web application architecture, API integration, state management, and responsive UI design.

## Acknowledgments

- CoinGecko for cryptocurrency market data
- Recharts for visualization library
- Tailwind CSS for styling framework

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [CoinGecko API](https://www.coingecko.com/en/api) for cryptocurrency data
- [Recharts](https://recharts.org/) for beautiful charts
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the UI framework

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ and React**
