# auth-service/Dockerfile
FROM php:8.2-cli
WORKDIR /app
COPY . .
CMD ["php", "-S", "0.0.0.0:3000", "-t", "./api"]
