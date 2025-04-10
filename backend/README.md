# BetterBooks Backend

A modern accounting application backend built with TypeScript, Express, and TypeORM.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=1d

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=betterbooks

   # Email Configuration
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=no-reply@betterbooks.com

   # Application Configuration
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:3001
   ```

4. Create the PostgreSQL database:
   ```bash
   createdb betterbooks
   ```

5. Run database migrations:
   ```bash
   npm run typeorm migration:run
   ```

## Development

To start the development server:
```bash
npm run dev
```

## Production

To build and start the production server:
```bash
npm run build
npm start
```

## API Documentation

The API documentation is available at `/api-docs` when running the server.

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password
- GET `/api/auth/verify-email/:token` - Verify email

### Accounts

- GET `/api/accounts` - Get all accounts
- POST `/api/accounts` - Create a new account
- GET `/api/accounts/:id` - Get account by ID
- PUT `/api/accounts/:id` - Update account
- DELETE `/api/accounts/:id` - Delete account

### Transactions

- GET `/api/transactions` - Get all transactions
- POST `/api/transactions` - Create a new transaction
- GET `/api/transactions/:id` - Get transaction by ID
- PUT `/api/transactions/:id` - Update transaction
- DELETE `/api/transactions/:id` - Delete transaction

### Documents

- GET `/api/documents` - Get all documents
- POST `/api/documents` - Upload a new document
- GET `/api/documents/:id` - Get document by ID
- DELETE `/api/documents/:id` - Delete document

## Testing

To run tests:
```bash
npm test
```

## License

MIT 