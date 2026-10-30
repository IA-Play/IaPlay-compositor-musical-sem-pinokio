@echo off
title IAPLAY Studio - Instalador
chcp 65001 >nul

echo ====================================================================
echo   IAPLAY STUDIO - Instalador Automatizado (Versao Standalone)
echo ====================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Garante pastas locais
if not exist "%SCRIPT_DIR%ckpts" mkdir "%SCRIPT_DIR%ckpts"
if not exist "%SCRIPT_DIR%outputs" mkdir "%SCRIPT_DIR%outputs"
if not exist "%SCRIPT_DIR%uploads" mkdir "%SCRIPT_DIR%uploads"
if exist "%SCRIPT_DIR%engine" (
    if not exist "%SCRIPT_DIR%engine\ckpts" (
        cmd /c mklink /J "%SCRIPT_DIR%engine\ckpts" "%SCRIPT_DIR%ckpts" >nul 2>&1
    )
)

REM 1. Verifica instalacao do Node.js
where node >nul 2>&1
if not errorlevel 1 goto :NODE_OK
echo [AVISO] Node.js nao detectado no sistema.
where winget >nul 2>&1
if errorlevel 1 goto :CHECK_NODE_AGAIN
echo Tentando instalar Node.js automaticamente pelo Windows Package Manager...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
:CHECK_NODE_AGAIN
where node >nul 2>&1
if errorlevel 1 goto :ERRO_NODE
:NODE_OK

where npm >nul 2>&1
if errorlevel 1 goto :ERRO_NPM
echo [OK] Node.js e npm prontos.

REM 2. Verifica instalacao do Python
where python >nul 2>&1
if not errorlevel 1 goto :PYTHON_OK
echo [AVISO] Python nao detectado no sistema.
where winget >nul 2>&1
if errorlevel 1 goto :CHECK_PYTHON_AGAIN
echo Tentando instalar Python 3.11 automaticamente pelo Windows Package Manager...
winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
:CHECK_PYTHON_AGAIN
where python >nul 2>&1
if errorlevel 1 goto :ERRO_PYTHON
:PYTHON_OK
echo [OK] Python detectado no sistema.

REM 3. Cria ambiente virtual Python (env) se nao existir
if exist "%SCRIPT_DIR%env\Scripts\python.exe" goto :ENV_JA_EXISTE
echo.
echo [1/4] Criando ambiente virtual Python dedicado 'env'...
python -m venv "%SCRIPT_DIR%env"
if not exist "%SCRIPT_DIR%env\Scripts\python.exe" (
    where uv >nul 2>&1
    if not errorlevel 1 uv venv "%SCRIPT_DIR%env" --seed --native-tls 2>nul
)
goto :ENV_CHECK_OK

:ENV_JA_EXISTE
echo [OK] Ambiente virtual 'env' ja existe.
:ENV_CHECK_OK

set "PYTHON_EXE=%SCRIPT_DIR%env\Scripts\python.exe"

REM 4. Instala PyTorch adequado (NVIDIA CUDA ou CPU)
echo.
echo [2/4] Verificando e instalando PyTorch...
where nvidia-smi >nul 2>&1
if errorlevel 1 goto :INSTALAR_PYTORCH_CPU

echo Detectada placa de video NVIDIA. Instalando PyTorch com aceleracao CUDA...
where uv >nul 2>&1
if not errorlevel 1 uv --native-tls pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 --python "%PYTHON_EXE%"
if errorlevel 1 "%PYTHON_EXE%" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
goto :PYTORCH_OK

:INSTALAR_PYTORCH_CPU
echo Placa NVIDIA nao detectada. Instalando PyTorch CPU...
where uv >nul 2>&1
if not errorlevel 1 uv --native-tls pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --python "%PYTHON_EXE%"
if errorlevel 1 "%PYTHON_EXE%" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
:PYTORCH_OK

REM 5. Instala pacotes do backend (requirements.txt)
echo.
echo [3/4] Instalando dependencias do servidor de IA...
where uv >nul 2>&1
if not errorlevel 1 uv --native-tls pip install setuptools wheel opencv-python-headless pillow -r "%SCRIPT_DIR%server\requirements.txt" --python "%PYTHON_EXE%"
if errorlevel 1 "%PYTHON_EXE%" -m pip install setuptools wheel opencv-python-headless pillow -r "%SCRIPT_DIR%server\requirements.txt"

REM 6. Instala dependencias do frontend web
echo.
echo [4/4] Instalando dependencias da interface web (Node.js)...
call npm install

REM 7. Modelos neurais YuE2 3B & SheetSage2
echo.
echo ====================================================================
echo   Modelos Neurais YuE2 3B & SheetSage2 (~6 GB)
echo ====================================================================
echo Voce pode baixar os modelos neurais agora ou diretamente pela
echo interface grafica na hora de gerar a musica pela primeira vez!
echo.
set /p BAIXAR_AGORA="Deseja baixar os modelos agora? (S/N) [Padrao: N]: "
if /i "%BAIXAR_AGORA%"=="S" (
    "%PYTHON_EXE%" "%SCRIPT_DIR%server\download_models.py"
) else (
    echo [INFO] Download pulado. Voce podera baixar direto pelo painel do estudio!
)

echo.
echo ====================================================================
echo   Instalacao do IAPLAY Studio concluida com sucesso!
echo   Para iniciar a aplicacao a qualquer momento, execute: iniciar.bat
echo ====================================================================
echo.
pause
exit /b 0

:ERRO_NODE
echo [ERRO] Node.js nao foi detectado no sistema!
echo Por favor, instale o Node.js versao LTS em: https://nodejs.org
pause
exit /b 1

:ERRO_NPM
echo [ERRO] npm nao foi detectado no sistema!
pause
exit /b 1

:ERRO_PYTHON
echo [ERRO] Python nao foi detectado no sistema!
echo Por favor, instale o Python 3.10 ou 3.11 em: https://python.org
echo Certifique-se de marcar a opcao "Add Python to PATH" durante a instalacao.
pause
exit /b 1
