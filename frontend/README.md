# PARC Admin Trainer Platform - Frontend

A comprehensive web application for managing educational programs, trainers, students, and administrative tasks.

## Features

### Admin Dashboard
- College Management
- Trainer Management and Approval
- Student Management
- Material Management
- Schedule Management
- Billing and Invoice Management
- Reporting Dashboard

### Trainer Dashboard
- Personal Schedule Management
- Student Management
- Material Viewer
- Billing Overview
- Calendar View

### Student Dashboard
- Course Management
- Assessment Tracking
- Leaderboard
- Progress Monitoring

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: Context API
- **API Integration**: Gemini API
- **Authentication**: JWT-based

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd parc-admin-trainer-platform/frontend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server
```bash
npm run dev
```

### Environment Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_GEMINI_API_KEY` - Gemini API key for AI features

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── icons/          # Icon components
│   ├── shared/         # Shared components
│   ├── student/        # Student-specific components
│   └── trainer/        # Trainer-specific components
├── context/            # React Context providers
├── services/           # API service modules
├── constants.js        # Application constants
└── types.js           # Type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary and confidential.
