# BetterBooks

A modern bookkeeping application designed to simplify financial recordkeeping for small business owners in the United States.

## Features

- **Initial Setup**
  - Asset identification and documentation
  - Account creation and management
  - Document upload and verification

- **Balance Sheet Management**
  - Real-time balance sheet construction
  - Asset, liability, and equity tracking
  - Financial position visualization

- **Transaction Management**
  - Easy transaction submission
  - AI-powered account classification
  - Document attachment support

- **Audit Trail**
  - Comprehensive transaction history
  - Advanced filtering and sorting
  - Document substantiation

- **Financial Reporting**
  - GAAP-compliant financial statements
  - Customizable report generation
  - Multiple export formats (PDF, Excel)

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Storage**: AWS S3
- **AI Integration**: OpenAI API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- AWS Account (for S3 storage)
- OpenAI API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://user:password@localhost:5432/betterbooks
   JWT_SECRET=your_jwt_secret
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_bucket_name
   OPENAI_API_KEY=your_openai_api_key

   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:3001
   ```

4. Start the development servers:
   ```bash
   # Start backend
   cd backend
   npm run dev

   # Start frontend
   cd frontend
   npm start
   ```

## Project Structure

```
betterbooks/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
