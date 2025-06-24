# BetterBooks

**Simple bookkeeping for small businesses**

A modern, user-friendly bookkeeping application designed specifically for small business owners. Built with React, TypeScript, Express, and PostgreSQL.

## ✨ Features

### Core Bookkeeping
- **Double-entry accounting** with automatic balance tracking
- **Account management** with smart categorization
- **Transaction recording** with detailed journal entries
- **Real-time financial reports** (Balance Sheet, Income Statement)
- **Smart transaction suggestions** based on description

### Business Intelligence
- **Dashboard overview** with key financial metrics
- **Cash flow tracking** across multiple accounts
- **Net worth calculation** and trend analysis
- **Smart goal suggestions** based on financial data
- **Recurring transaction management**

### User Experience
- **Intuitive interface** designed for non-accountants
- **Mobile-responsive** design
- **Real-time data synchronization**
- **Secure authentication** with JWT
- **Automatic account categorization**

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alexbrandon3/BetterBooks.git
   cd BetterBooks
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   # Backend (.env file in backend/ directory)
   DATABASE_URL=postgresql://username:password@localhost:5432/betterbooks
   JWT_SECRET=your-secret-key
   NODE_ENV=development
   PORT=5000
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏗️ Project Structure

```
BetterBooks/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── entities/       # TypeORM database entities
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── migrations/     # Database migrations
│   │   └── config/         # Configuration files
│   └── package.json
└── package.json            # Root package.json with scripts
```

## 📦 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start production servers

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start with nodemon for development
- `npm run build` - Compile TypeScript
- `npm run start:prod` - Start production server

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form management
- **React Hot Toast** for notifications

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **TypeORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests

## 🚀 Deployment

The application is deployed on Render:
- **Frontend**: https://betterbooks-frontend.onrender.com
- **Backend**: https://betterbooks.onrender.com

### Environment Variables for Production
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to "production"
- `PORT` - Server port (set by Render)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support or questions, please open an issue on GitHub or contact the development team.

---

**BetterBooks** - Making bookkeeping simple for small businesses. 📊
