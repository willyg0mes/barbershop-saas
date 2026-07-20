#!/bin/sh
set -e

cd /var/www/html

if [ "$APP_ENV" = "production" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

php artisan migrate --force --no-interaction

exec "$@"
