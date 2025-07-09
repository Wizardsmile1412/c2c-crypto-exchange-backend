# C2C Crypto Exchange Backend

A comprehensive REST API for a peer-to-peer cryptocurrency exchange platform built with Node.js, Express, and PostgreSQL. This backend enables users to trade cryptocurrencies, manage wallets, execute transfers, and handle fiat transactions.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Wallet Management**: Multi-currency wallet support with balance tracking
- **P2P Trading**: Order matching system for buying/selling cryptocurrencies
- **Money Transfers**: Secure peer-to-peer transfers between users
- **Fiat Integration**: Deposit and withdrawal processing with payment gateways
- **Real-time Market Data**: Live market statistics and recent trades via CoinGecko API
- **Admin Management**: Administrative controls for transaction management

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: dotenv for configuration
- **Database Migrations**: Sequelize CLI
- **Market Data**: CoinGecko API integration

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd c2c-crypto-exchange-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. **Run database migrations**
   ```bash
   npx sequelize-cli db:migrate
   ```

5. **Seed the database (optional)**
   ```bash
   npx sequelize-cli db:seed:all
   ```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your environment).

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Wallet Management
- `GET /api/wallets` - Get user wallets
- `GET /api/wallets/summary` - Get wallet summary
- `GET /api/wallets/:currency` - Get specific currency wallet

### Trading System
- `POST /api/orders` - Create trade order
- `GET /api/orders` - Get user orders
- `GET /api/orders/market` - Get market orders
- `PATCH /api/orders/:orderId/cancel` - Cancel order

### Money Transfers
- `POST /api/transfer` - Create transfer
- `GET /api/transfer/history` - Get transfer history
- `GET /api/transfer/search-users` - Search users for transfer

### Market Data
- `GET /api/matches/trades` - Get user trades
- `GET /api/matches/market-stats` - Get market statistics
- `GET /api/matches/recent` - Get recent trades

### Payment Processing
- `POST /api/payments/deposits` - Create deposit request
- `GET /api/payments/transactions` - Get user transactions
- `PATCH /api/payments/transactions/:id/cancel` - Cancel transaction

## 📁 Project Structure

```
├── config/
│   └── config.cjs              # Database configuration
├── migrations/                 # Database migration files
├── models/                     # Sequelize models
├── seeders/                    # Database seeders
├── src/
│   ├── controllers/           # Route controllers
│   ├── middlewares/           # Express middlewares
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   └── app.js                 # Express app configuration
├── .env                       # Environment variables
├── .sequelizerc              # Sequelize configuration
└── package.json              # Dependencies and scripts
```

## 🔧 Configuration

### Database Configuration
The database configuration is managed through [config/config.cjs](config/config.cjs). Set your `DATABASE_URL` environment variable to connect to your PostgreSQL database.

### Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Environment (development/production)
- `COINGECKO_API_KEY`: CoinGecko API key (optional for higher rate limits)
- `COINGECKO_BASE_URL`: CoinGecko API base URL (default: https://api.coingecko.com/api/v3)

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Authentication**: Stateless authentication with JSON Web Tokens
- **Input Validation**: Request validation and sanitization
- **SQL Injection Protection**: Sequelize ORM provides protection against SQL injection
- **CORS Configuration**: Configurable cross-origin resource sharing

## 🧪 Testing

The project includes Postman collection for API testing:
```bash
# Import the collection
postman_collection.json
```

## 📊 Database Schema

### Entity Relationship Diagram (ERD)
View the complete database schema and relationships:
**[🔗 Interactive ERD - Crypto C2C Exchange Database](https://dbdiagram.io/d/Crypto-C2C-Exchange-686b8b41f413ba35089777cc)**

The application uses the following main entities:
- **Users**: User accounts and authentication
- **Wallets**: Multi-currency wallet balances
- **Trade Orders**: Buy/sell orders
- **Order Match Events**: Completed trades
- **Fiat Transactions**: Deposit/withdrawal records
- **Internal Transfers**: User-to-user transfers within the system
- **External Transfers**: P2P transfers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔄 Version History

- **v1.0.0**: Initial release with core trading functionality
- **v1.1.0**: Added payment gateway integration
- **v1.2.0**: Enhanced security and admin features

## 🚀 Further Features to Develop

### External Transfer Feature

---

**Note**: This is a backend API service. You'll need a frontend application to interact with these endpoints. Make sure to configure CORS settings appropriately for your frontend domain.
