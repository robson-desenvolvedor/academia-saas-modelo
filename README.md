# Academia SaaS Modelo

Modelo para proposta comercial de uma plataforma SaaS de agendamento para academias e personal trainers.

## Estrutura

- `frontend-vercel`: demo React + TypeScript + Vite para subir na Vercel.
- `backend-laravel-api`: base Laravel API para evoluir o projeto real com PostgreSQL.
- `docs`: proposta e guia de apresentacao.

## Frontend

A demo visual agora esta funcional:

- calendario mensal real;
- cadastro de horarios;
- reservas com validacao de vagas;
- cancelamento de reserva;
- gestao de profissionais;
- configuracoes editaveis;
- exportacao CSV;
- dados salvos no navegador por localStorage;
- layout mobile-first estilo app.

Rodar:

```bash
cd frontend-vercel
npm install
npm run dev
```

## Backend

Base tecnica para API Laravel:

```bash
cd backend-laravel-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

A demo de apresentacao nao depende do backend para funcionar.
