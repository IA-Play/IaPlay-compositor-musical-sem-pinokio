@echo off
title IAPLAY Studio
chcp 65001 >nul

echo ====================================================================
echo   IAPLAY STUDIO - Compositor Musical com IA
echo ====================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 1. Verifica se ambiente virtual existe
if exist "%SCRIPT_DIR%env" goto :ENV_OK
echo [INFO] Detectamos que esta e a primeira vez que voce executa o IAPLAY!
echo Vamos configurar automaticamente o ambiente e baixar o que e necessario.
echo.
call "%SCRIPT_DIR%instalar.bat"
if errorlevel 1 goto :ERRO_INSTALL
:ENV_OK

REM 2. Localiza Python
set "PYTHON_EXE="
if exist "%SCRIPT_DIR%env\Scripts\python.exe" set "PYTHON_EXE=%SCRIPT_DIR%env\Scripts\python.exe"

if defined PYTHON_EXE goto :PYTHON_DEFINIDO
where python >nul 2>&1
if not errorlevel 1 set "PYTHON_EXE=python"
:PYTHON_DEFINIDO

if not defined PYTHON_EXE goto :ERRO_PYTHON

echo [OK] Python: %PYTHON_EXE%

REM 2.1 Verifica modulo essencial setuptools
"%PYTHON_EXE%" -c "import setuptools" >nul 2>&1
if not errorlevel 1 goto :SETUPTOOLS_OK
echo [IAPLAY] Instalando modulo neural essencial setuptools...
where uv >nul 2>&1
if not errorlevel 1 goto :UV_SETUPTOOLS
"%PYTHON_EXE%" -m pip install setuptools wheel >nul 2>&1
goto :SETUPTOOLS_OK
:UV_SETUPTOOLS
uv --native-tls pip install setuptools wheel --python "%PYTHON_EXE%" >nul 2>&1
:SETUPTOOLS_OK

REM 2.2 Verifica modulos essenciais do motor neural
"%PYTHON_EXE%" -c "import cv2, PIL, imageio, git, mmgp; assert mmgp.__version__ == '3.7.12'" >nul 2>&1
if not errorlevel 1 goto :DEPS_OK
echo [IAPLAY] Atualizando dependencias neurais essenciais...
where uv >nul 2>&1
if not errorlevel 1 goto :UV_DEPS
"%PYTHON_EXE%" -m pip install -r "%SCRIPT_DIR%server\requirements.txt" >nul 2>&1
goto :DEPS_OK
:UV_DEPS
uv --native-tls pip install -r "%SCRIPT_DIR%server\requirements.txt" --python "%PYTHON_EXE%" >nul 2>&1
:DEPS_OK

REM 3. Verifica Node.js
where node >nul 2>&1
if errorlevel 1 goto :ERRO_NODE

REM 4. Verifica dependencias da interface web
if exist "%SCRIPT_DIR%node_modules" goto :NODE_MODULES_OK
echo [IAPLAY] Instalando dependencias web...
call npm install
if errorlevel 1 goto :ERRO_NPM
:NODE_MODULES_OK

REM 5. Verifica modelos neurais YuE2
echo [IAPLAY] Verificando modelos neurais YuE2...
"%PYTHON_EXE%" "%SCRIPT_DIR%server\download_models.py"

REM 6. Inicia servico do Ollama se instalado localmente
netstat -ano | findstr ":11434 " | findstr "LISTENING" >nul
if not errorlevel 1 goto :OLLAMA_JA_ATIVO
where ollama >nul 2>&1
if not errorlevel 1 goto :START_OLLAMA_CMD
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" goto :START_OLLAMA_APP
goto :OLLAMA_JA_ATIVO

:START_OLLAMA_CMD
echo [IAPLAY] Iniciando servico Ollama...
start /b "" ollama serve >nul 2>&1
goto :OLLAMA_JA_ATIVO

:START_OLLAMA_APP
echo [IAPLAY] Iniciando servico Ollama...
start /b "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve >nul 2>&1
:OLLAMA_JA_ATIVO

REM 7. Inicia Servidor YuE2 na porta 42024 se nao estiver ativo
netstat -ano | findstr ":42024 " | findstr "LISTENING" >nul
if not errorlevel 1 goto :YUE2_JA_ATIVO
echo [1/2] Iniciando motor neural YuE2 na porta 42024...
start "IAPLAY YuE2 Engine" /min "%PYTHON_EXE%" "%SCRIPT_DIR%server\yue_server.py" --port 42024 --host 127.0.0.1
ping 127.0.0.1 -n 4 >nul
goto :YUE2_INICIADO
:YUE2_JA_ATIVO
echo [1/2] Motor neural YuE2 ja esta ativo na porta 42024.
:YUE2_INICIADO

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
exit /b 0

:ERRO_INSTALL
echo [ERRO] Ocorreu uma falha na instalacao. Verifique as mensagens acima.
pause
exit /b 1

:ERRO_PYTHON
echo [ERRO] Ambiente Python nao encontrado!
echo Execute o instalador: instalar.bat
echo.
pause
exit /b 1

:ERRO_NODE
echo [ERRO] Node.js nao foi detectado neste computador!
echo Instale o Node.js em: https://nodejs.org ou execute instalar.bat
echo.
pause
exit /b 1

:ERRO_NPM
echo [ERRO] Falha ao instalar dependencias do Node.js.
pause
exit /b 1
