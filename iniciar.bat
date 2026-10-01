@echo off
title IAPLAY Studio
chcp 65001 >nul

echo ====================================================================
echo   IAPLAY STUDIO - Compositor Musical com IA
echo ====================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 1. Verifica se e a primeira execucao (ambiente env ausente)
if not exist "%SCRIPT_DIR%env" (
    echo [INFO] Detectamos que esta e a primeira vez que voce executa o IAPLAY!
    echo Vamos configurar automaticamente o ambiente e baixar o que e necessario.
    echo.
    call "%SCRIPT_DIR%instalar.bat"
    if errorlevel 1 (
        echo [ERRO] Ocorreu uma falha na instalacao. Verifique as mensagens acima.
        pause
        exit /b 1
    )
)

REM 2. Localiza Python
set "PYTHON_EXE="
if exist "%SCRIPT_DIR%env\Scripts\python.exe" (
    set "PYTHON_EXE=%SCRIPT_DIR%env\Scripts\python.exe"
)

if "%PYTHON_EXE%"=="" (
    where python >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_EXE=python"
    )
)

if "%PYTHON_EXE%"=="" (
    echo [ERRO] Ambiente Python nao encontrado!
    echo Execute o instalador: instalar.bat
    echo.
    pause
    exit /b 1
)

echo [OK] Python: %PYTHON_EXE%

REM 2.1 Verifica modulo essencial setuptools (necessario para compilacao de extensoes PyTorch/BigVGAN)
"%PYTHON_EXE%" -c "import setuptools" >nul 2>&1
if errorlevel 1 (
    echo [IAPLAY] Instalando modulo neural essencial setuptools...
    "%PYTHON_EXE%" -m pip install setuptools wheel >nul 2>&1
)

REM 3. Verifica Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao foi detectado neste computador!
    echo Instale o Node.js em: https://nodejs.org ou execute instalar.bat
    echo.
    pause
    exit /b 1
)

REM 4. Verifica se dependencias Node.js estao presentes
if not exist "%SCRIPT_DIR%node_modules" (
    echo [IAPLAY] Instalando dependencias web...
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do Node.js.
        pause
        exit /b 1
    )
)

REM 5. Verifica se os modelos neurais YuE2 estao presentes (download automatico se faltar algum)
echo [IAPLAY] Verificando modelos neurais YuE2...
"%PYTHON_EXE%" "%SCRIPT_DIR%server\download_models.py"

REM 6. Inicia servico do Ollama se instalado localmente
netstat -ano | findstr ":11434 " | findstr "LISTENING" >nul
if errorlevel 1 (
    where ollama >nul 2>&1
    if not errorlevel 1 (
        echo [IAPLAY] Iniciando servico Ollama...
        start /b "" ollama serve >nul 2>&1
    ) else if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        echo [IAPLAY] Iniciando servico Ollama...
        start /b "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve >nul 2>&1
    )
)

REM 7. Inicia Servidor YuE2 na porta 42024 se nao estiver ativo
netstat -ano | findstr ":42024 " | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [1/2] Iniciando motor neural YuE2 na porta 42024...
    start "IAPLAY YuE2 Engine" /min "%PYTHON_EXE%" "%SCRIPT_DIR%server\yue_server.py" --port 42024 --host 127.0.0.1
    ping 127.0.0.1 -n 4 >nul
) else (
    echo [1/2] Motor neural YuE2 ja esta ativo na porta 42024.
)

REM 8. Inicia o Frontend e abre automaticamente no navegador
echo [2/2] Iniciando interface grafica IAPLAY Studio...
echo.
echo ====================================================================
echo   IAPLAY Studio pronto!
echo   Acesse no navegador: http://localhost:5173
echo   Para encerrar a aplicacao, basta fechar esta janela.
echo ====================================================================
echo.

call npm run dev -- --open

echo.
echo [IAPLAY Studio finalizado.]
pause
