@echo off
title IAPLAY Studio - Instalador
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ====================================================================
echo   IAPLAY STUDIO - Instalador Automatizado (Versao Standalone)
echo ====================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 1. Verifica instalacao do Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Node.js nao detectado no sistema.
    where winget >nul 2>&1
    if not errorlevel 1 (
        echo Tentando instalar Node.js automaticamente pelo Windows Package Manager...
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    )
    where node >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Node.js nao foi detectado no sistema!
        echo Por favor, instale o Node.js versao LTS em: https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] npm nao foi detectado no sistema!
    pause
    exit /b 1
)
echo [OK] Node.js e npm prontos.

REM 2. Verifica instalacao do Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Python nao detectado no sistema.
    where winget >nul 2>&1
    if not errorlevel 1 (
        echo Tentando instalar Python 3.11 automaticamente pelo Windows Package Manager...
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    )
    where python >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Python nao foi detectado no sistema!
        echo Por favor, instale o Python 3.10 ou 3.11 em: https://python.org
        echo Certifique-se de marcar a opcao "Add Python to PATH" durante a instalacao.
        echo.
        pause
        exit /b 1
    )
)
echo [OK] Python detectado no sistema.

REM 3. Cria ambiente virtual Python (env) se nao existir
if not exist "%SCRIPT_DIR%env" (
    echo.
    echo [1/4] Criando ambiente virtual Python dedicado 'env'...
    where uv >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        uv venv "%SCRIPT_DIR%env" --python 3.11 2>nul || uv venv "%SCRIPT_DIR%env" 2>nul || python -m venv "%SCRIPT_DIR%env"
    ) else (
        python -m venv "%SCRIPT_DIR%env"
    )
) else (
    echo [OK] Ambiente virtual 'env' ja existe.
)

set "PYTHON_EXE=%SCRIPT_DIR%env\Scripts\python.exe"

REM 4. Instala PyTorch adequado (NVIDIA CUDA ou CPU)
echo.
echo [2/4] Verificando e instalando PyTorch...
where nvidia-smi >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Detectada placa de video NVIDIA. Instalando PyTorch com aceleracao CUDA...
    where uv >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 --python "%PYTHON_EXE%"
    ) else (
        "%PYTHON_EXE%" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
    )
) else (
    echo Placa NVIDIA nao detectada. Instalando PyTorch CPU...
    where uv >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --python "%PYTHON_EXE%"
    ) else (
        "%PYTHON_EXE%" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
    )
)

REM 5. Instala pacotes do backend (requirements.txt)
echo.
echo [3/4] Instalando dependencias do servidor de IA...
where uv >nul 2>&1
if %ERRORLEVEL% equ 0 (
    uv pip install setuptools wheel opencv-python-headless pillow -r "%SCRIPT_DIR%server\requirements.txt" --python "%PYTHON_EXE%"
) else (
    "%PYTHON_EXE%" -m pip install setuptools wheel opencv-python-headless pillow -r "%SCRIPT_DIR%server\requirements.txt"
)

REM 6. Instala dependencias do frontend web
echo.
echo [4/4] Instalando dependencias da interface web (Node.js)...
call npm install

REM 7. Download dos pesos neurais YuE2
echo.
echo ====================================================================
echo   Verificando e baixando pesos neurais YuE2 (Hugging Face)
echo ====================================================================
"%PYTHON_EXE%" "%SCRIPT_DIR%server\download_models.py"

echo.
echo ====================================================================
echo   Instalacao do IAPLAY Studio concluida com sucesso!
echo   Para iniciar a aplicacao a qualquer momento, execute: iniciar.bat
echo ====================================================================
echo.
pause
