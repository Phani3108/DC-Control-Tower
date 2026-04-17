FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (pypdf needs nothing; httpx + anthropic pull in what they need)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/
RUN pip install --upgrade pip \
    && pip install "fastapi>=0.115.0" "uvicorn[standard]>=0.32.0" "anthropic>=0.40.0" \
                    "pydantic>=2.9.0" "pydantic-settings>=2.6.0" "sse-starlette>=2.1.3" \
                    "pypdf>=5.1.0" "httpx>=0.27.0" "pyyaml>=6.0.2"

COPY . /app/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:8000/v1/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
