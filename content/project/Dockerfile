# Build:  docker build -t card-payments-api .
# Run:    docker run -p 8000:8000 card-payments-api
# Then open http://localhost:8000/docs
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV DATABASE_PATH=/app/data/payments.db
RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
