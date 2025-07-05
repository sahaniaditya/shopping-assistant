# Walmart Backend API

A FastAPI backend service for the Walmart 2025 project.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Run the development server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Or run directly with Python:
   ```bash
   python main.py
   ```

## API Endpoints

- `GET /` - Welcome message and health status
- `GET /health` - Health check endpoint
- `GET /api/v1/hello` - Hello world endpoint

## Documentation

Once the server is running, you can access:
- **Interactive API Documentation (Swagger UI):** http://localhost:8000/docs
- **Alternative API Documentation (ReDoc):** http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore file
├── __init__.py         # Package initialization
└── README.md           # This file
```

## Development

- The server runs on `http://localhost:8000` by default
- CORS is configured to allow requests from `http://localhost:3000` (React frontend)
- Auto-reload is enabled in development mode 