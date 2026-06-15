# Backend Laravel API — FitAgenda Pro

API base para o SaaS de agendamento de academias e personal trainers.

## Instalação

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Banco

Por padrão o projeto está preparado para PostgreSQL:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fitagenda
DB_USERNAME=postgres
DB_PASSWORD=
```

Para testar rápido com SQLite, troque no `.env`:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/caminho/absoluto/database/database.sqlite
```

Crie o arquivo:

```bash
touch database/database.sqlite
php artisan migrate --seed
```

## Usuários de teste

- Admin: `admin@fitagenda.local` / `password`
- Aluno: `aluno@fitagenda.local` / `password`
- Trainers: `marina@fitagenda.local`, `rafael@fitagenda.local`, `ana@fitagenda.local` / `password`

## Endpoints principais

Base: `/api/v1`

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET|POST /trainers`
- `GET|POST /classes`
- `GET|POST /schedule-slots`
- `GET|POST /bookings`
- `PATCH /bookings/{booking}/confirm`
- `PATCH /bookings/{booking}/cancel`

## E-mails

O envio de e-mail está configurado como `log` no ambiente local. Em produção, configure SMTP no `.env`.
