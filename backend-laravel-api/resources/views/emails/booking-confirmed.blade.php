<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Agendamento confirmado</title>
</head>
<body style="font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px;">
        <h1 style="margin-top: 0;">Agendamento confirmado</h1>
        <p>Olá, {{ $booking->student->name }}.</p>
        <p>Seu horário foi confirmado com sucesso.</p>
        <ul>
            <li><strong>Aula/Treino:</strong> {{ $booking->scheduleSlot->trainingClass->title }}</li>
            <li><strong>Profissional:</strong> {{ $booking->scheduleSlot->trainer->user->name ?? 'Equipe da academia' }}</li>
            <li><strong>Data:</strong> {{ $booking->scheduleSlot->starts_at->format('d/m/Y H:i') }}</li>
        </ul>
        <p>Até lá!</p>
    </div>
</body>
</html>
