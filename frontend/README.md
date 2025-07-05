# Walmart 2025 Frontend

A modern Next.js frontend application for the Walmart 2025 project, built with TypeScript, Tailwind CSS, and React 19.

## 🚀 Features

- **Next.js 15.3.5** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 19** with hooks
- **Axios** for API calls
- **Heroicons** for modern icons
- **ESLint** for code quality
- **Responsive Design** for all devices
- **Real-time API Status** monitoring

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main homepage
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   └── ui/
│       ├── Button.tsx       # Reusable button component
│       └── Header.tsx       # Header component
├── hooks/
│   └── useApiStatus.ts      # Custom hook for API status
├── lib/
│   └── api.ts              # API configuration and services
└── ...
```

## 🛠️ Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_APP_NAME="Walmart 2025"
   NEXT_PUBLIC_APP_VERSION="1.0.0"
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 API Integration

The frontend automatically connects to the backend API at `http://localhost:8000`. Features include:

- **Health Check**: Real-time API status monitoring
- **Error Handling**: Graceful error handling with user feedback
- **Interceptors**: Request/response interceptors for authentication
- **Loading States**: Proper loading states for better UX

## 🎨 Components

### Button Component
A reusable button component with multiple variants:
- `primary` - Primary blue button
- `secondary` - Yellow Walmart-themed button
- `outline` - Outlined button
- `ghost` - Ghost button

### Header Component
Modern header with:
- Walmart branding
- Navigation menu
- API status indicator
- Shopping cart icon

## 🎯 Custom Hooks

### useApiStatus
A custom hook that:
- Checks API connectivity
- Provides loading states
- Handles errors gracefully
- Auto-refreshes every 30 seconds

## 🌐 API Services

Centralized API service configuration:
- Base URL configuration
- Request/response interceptors
- Error handling
- Authentication ready

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Responsive design** with mobile-first approach
- **Walmart brand colors** (blue, yellow, white)
- **Modern UI components** with hover effects and transitions

## 🔒 Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_VERSION` - Application version

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🚀 Deployment

The app is ready for deployment on platforms like:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS**
- **Google Cloud**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary to Walmart.

---

For more information about Next.js, visit [nextjs.org](https://nextjs.org).
