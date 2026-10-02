@echo off
title IAPLAY Studio - Encerrar
chcp 65001 >nul

echo ====================================================================
echo   IAPLAY STUDIO - Encerrando Servicos
echo ====================================================================
echo.

echo Finalizando servicos na porta 42024 (Motor YuE2)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":42024" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Finalizando processos do servidor Vite/Node...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Todos os servicos do IAPLAY foram encerrados com sucesso.
ping 127.0.0.1 -n 3 >nul
