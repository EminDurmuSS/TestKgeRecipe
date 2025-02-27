FROM python:3.12-slim

# Environment variables for memory optimization
ENV PYTHONUNBUFFERED=1
ENV PYTHONMALLOC=malloc
ENV MALLOC_TRIM_THRESHOLD_=65536
ENV PYTHONDONTWRITEBYTECODE=1

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Run with optimized settings
CMD ["gunicorn","-k", "uvicorn.workers.UvicornWorker","--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "1000", "--keep-alive", "1000", "--preload", "--worker-tmp-dir", "/dev/shm", "main:app"]