<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('fitagenda:about', function () {
    $this->info('FitAgenda Pro - API Laravel para SaaS de agendamento fitness.');
});
