# BarberShop SaaS — API (Laravel 11)
FROM php:8.3-fpm-bookworm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip curl libpq-dev libzip-dev libpng-dev libicu-dev \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install -j$(nproc) pdo_pgsql pgsql zip intl bcmath opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM base AS development

RUN pecl install xdebug && docker-php-ext-enable xdebug || true

COPY api/composer.json api/composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

COPY api/ .
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000
CMD ["php-fpm"]

FROM base AS production

COPY api/composer.json api/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --optimize-autoloader

COPY api/ .
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

COPY deploy/api/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
