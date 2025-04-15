# BetterBooks

A modern bookkeeping application for small business owners, built with React, TypeScript, Express, and PostgreSQL.

## Features

- User-friendly interface with Material UI
- Account management (create, read, update, delete)
- Real-time balance tracking
- Transaction history
- Dashboard with key metrics

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/betterbooks.git
   cd betterbooks
   ```

2. Install dependencies:
   ```bash
   npm install
   npm run install:all
   ```

3. Set up the database:
   - Create a PostgreSQL database named `betterbooks`
   - Update the `.env` file in the `backend` directory with your database credentials

4. Start the development servers:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
betterbooks/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── utils/        # Utility functions
│   └── package.json
├── backend/               # Express backend
│   ├── src/
│   │   ├── entities/     # TypeORM entities
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API routes
│   │   └── config/       # Configuration files
│   └── package.json
└── package.json          # Root package.json
```

## Available Scripts

- `npm run dev` - Start both frontend and backend servers
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build both frontend and backend
- `npm start` - Start the production server

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
