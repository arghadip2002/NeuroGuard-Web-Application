# Dockerfile for Hugging Face Spaces
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app ./app
COPY backend/models ./models

# Create necessary directories
RUN mkdir -p ./uploads ./static

# Copy built frontend from builder stage
COPY --from=frontend-builder /frontend/dist ./static

# Expose port 7860 (required by Hugging Face Spaces)
EXPOSE 7860

# Run the FastAPI application on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]