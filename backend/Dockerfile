FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System dependencies for MySQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project files
COPY . .

# Create staticfiles directory
RUN mkdir -p staticfiles

EXPOSE 8000

# Run migrations + collectstatic + start gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && \
     python manage.py collectstatic --noinput || true && \
     gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"]