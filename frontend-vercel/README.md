# FitAgenda Pro - Demo multi-perfil

Modelo React + TypeScript + Vite para apresentar uma plataforma SaaS de agendamento para academias e personal trainers.

## O que foi reforçado nesta versão

- Login funcional sem backend, com 3 perfis de demonstração.
- Painel da academia, painel do personal e painel do aluno com menus diferentes.
- Usuários de acesso, alunos e profissionais com listagens reais.
- Calendário mensal navegável com eventos por dia.
- Cadastro de aulas, sessões, avaliações e horários de personal.
- Reserva de horário pelo aluno com validação de vaga.
- Cancelamento de reserva liberando vaga.
- Personal visualiza somente a própria agenda e seus alunos.
- Academia gerencia todos os horários, usuários, profissionais, reservas e relatórios.
- Dados mockados no código e persistidos no navegador via localStorage.
- Sidebar recolhível no desktop e navegação inferior no mobile.
- Fonte de sistema, layout compacto, administrativo e com pouco arredondamento.

## Acessos da demo

```txt
Academia: academia@demo.com / 123456
Personal:  personal@demo.com / 123456
Aluno:     aluno@demo.com / 123456
```

Também existem botões de acesso rápido na tela de login.

## Rodar localmente

```bash
cd frontend-vercel
npm install
npm run dev
```

Acesse:

```bash
http://localhost:5173
```

Se a porta estiver ocupada:

```bash
npm run dev -- --port 5174
```

## Build para Vercel

```bash
npm run build
```

Na Vercel, suba esta pasta `frontend-vercel`.

## Observação importante

Esta versão foi feita para apresentação comercial. Ela funciona sem banco de dados, usando dados no código e `localStorage`. Para produção, o próximo passo é ligar estes fluxos ao backend Laravel/API e PostgreSQL.
