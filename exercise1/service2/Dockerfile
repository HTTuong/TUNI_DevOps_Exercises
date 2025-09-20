FROM python:3.9-alpine

WORKDIR /app

# Install coreutils for disk space checking commands
RUN apk add --no-cache coreutils

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3001

CMD ["python", "app.py"]