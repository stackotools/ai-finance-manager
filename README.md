# 💰 AI-Powered Personal Finance Manager (FinanceAI)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-38B2AC.svg)](https://tailwindcss.com/)
[![Claude AI](https://img.shields.io/badge/AI-Anthropic%20Claude-blueviolet.svg)](https://www.anthropic.com/)

FinanceAI is an intelligent, modern full-stack personal finance management web application designed to help individuals track expenses, monitor cash flow, create proactive budgets, and receive personalized financial insights powered by Anthropic's Claude AI.

---

## ✨ Features

- **📊 Expense & Income Tracking**: Seamlessly log, edit, and organize daily transactions across various categories and payment methods.
- **🤖 Smart Auto-Categorization**: Intelligent transaction tagging and categorization powered by Claude AI and pattern matching rules.
- **📈 Interactive Dashboard Charts**: Dynamic visual representations of spending habits, income vs. expense ratios, and historical cash flow trends.
- **💡 AI Insights & Recommendations**: Automated financial health assessments, anomaly detection, and actionable suggestions to maximize savings.
- **🔮 Predictive Cash Flow**: Forecast end-of-month balances and anticipate upcoming recurring expenses based on historical behavior.
- **🎯 Budget & Goal Management**: Create custom category budgets, track spending progress in real-time, and get notified before exceeding limits.
- **📄 Bank Statement Upload**: Upload bank statements (CSV/XLS/XLSX) for automated parsing, transaction reconciliation, and bulk importing.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Fast modern single-page application framework and build tool |
| **Styling** | Tailwind CSS | Utility-first responsive CSS styling |
| **Backend** | Node.js, Express.js | Robust RESTful API server handling business logic |
| **Database** | MongoDB, Mongoose | Document-oriented NoSQL database with strict schema modeling |
| **Authentication** | JWT & bcryptjs | Stateless token-based authentication and secure password encryption |
| **AI Engine** | Google Gemini API (1.5 Flash / 2.5 Flash) | Contextual financial reasoning, classification, and proactive advice |
| **Testing** | Jest, Supertest | Automated test runner and HTTP assertions |

---

## 📋 Prerequisites

Before setting up the project locally, verify that you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or yarn / pnpm
- **MongoDB** (Local daemon running on `mongodb://localhost:27017` or a MongoDB Atlas connection string)
- **Anthropic API Key** (Obtainable from the [Anthropic Console](https://console.anthropic.com/))

---

## 🚀 Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/your-username/ai-finance-manager.git
cd ai-finance-manager
```

### 2. Server Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your environment variables in .env (see table below)

# Start backend server in development mode
npm run dev
```

### 3. Client Setup
```bash
# Open a new terminal and navigate to client directory
cd client

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start client development server
npm run dev
```

The web application should now be accessible at `http://localhost:5173`, with the backend server listening on `http://localhost:5000`.

---

## ⚙️ Environment Variables

### Server (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port number the backend server runs on | `5000` |
| `NODE_ENV` | Application runtime environment | `development` / `production` |
| `MONGODB_URI` | MongoDB connection URI string | `mongodb://localhost:27017/finance_manager` |
| `JWT_SECRET` | Secret key used for signing JWT access tokens | `your_secure_random_jwt_secret` |
| `JWT_EXPIRES_IN` | Validity duration for access tokens | `7d` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API secret key | `sk-ant-api03-...` |
| `CLIENT_URL` | Allowed origin for Cross-Origin Resource Sharing (CORS) | `http://localhost:5173` |

### Client (`client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint URL for the backend REST API | `http://localhost:5000/api` |

---

## 🧪 Running Tests

To run the backend test suite:
```bash
cd server
npm test
```

To run tests in watch mode during development:
```bash
cd server
npm run test:watch
```

---

## 🔌 API Overview

The backend REST API provides structured endpoints grouped by resource domain:

| Group | Base Endpoint | Description |
| :--- | :--- | :--- |
| **Authentication** | `/api/auth` | User registration, login, current session retrieval, password updates |
| **Transactions** | `/api/transactions` | Create, read, update, delete, filter, and search transaction records |
| **Categories** | `/api/categories` | Custom category creation, default seed categories, and rule settings |
| **Budgets** | `/api/budgets` | Set, evaluate, and monitor category-based budget caps |
| **AI Insights** | `/api/insights` | Retrieve AI-generated spending patterns, anomalies, and recommendations |
| **Predictions** | `/api/predictions` | Projected cash balance and recurring bill forecasts |
| **Statements** | `/api/upload` | Bank statement file upload (CSV/XLS/XLSX) and transaction reconciliation |

---

## 🏗 Build Phases Status

- [x] **Phase 1**: Project Initialization & Core Architecture Setup ✅
- [ ] **Phase 2**: Authentication & User Management 🔄
- [ ] **Phase 3**: Transaction Management & Category Engine 🔄
- [ ] **Phase 4**: Interactive Dashboard & Visualizations 🔄
- [ ] **Phase 5**: Budgeting & Goal Tracking System 🔄
- [ ] **Phase 6**: AI Categorization & Claude Insights Engine 🔄
- [ ] **Phase 7**: Predictive Cash Flow & Bank Statement Import 🔄
- [ ] **Phase 8**: End-to-End Testing, Polish & Hardening 🔄

---

## 🚢 Deployment Guide

*(Deployment guides will be finalized during deployment readiness in later phases)*

- **Frontend**: Optimized static build produced via `npm run build` within `client/`, suitable for deployment to Vercel, Netlify, or AWS S3 + CloudFront.
- **Backend**: Containerized Docker image or Node runtime deployed on platforms such as Render, Railway, or AWS ECS/App Runner.
- **Database**: MongoDB Atlas managed database cluster configured with connection pooling and SSL encryption.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
