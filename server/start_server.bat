@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
set PIP_REQUIRE_VIRTUALENV=false
set PIP_NO_REQUIRE_VIRTUALENV=1

echo [IAPLAY Engine] Verificando ambiente e servicos para IAPLAY...

REM 1. Verifica e ativa ambiente virtual Python
if not exist "%~dp0..\env\Scripts\python.exe" (
    echo [IAPLAY Engine] Criando ambiente virtual Python dedicado...
    uv venv "%~dp0..\env" --python 3.11 >nul 2>&1 || uv venv "%~dp0..\env" >nul 2>&1 || python -m venv "%~dp0..\env" >nul 2>&1
)

set PYTHON_EXE=
if exist "%~dp0..\env\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0..\env\Scripts\python.exe"
    if exist "%~dp0..\env\Scripts\activate.bat" (
        call "%~dp0..\env\Scripts\activate.bat"
    )
) else if exist "%~dp0..\..\env\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0..\..\env\Scripts\python.exe"
) else (
    set PYTHON_EXE=python
)

echo [IAPLAY Engine] Utilizando Python: %PYTHON_EXE%

REM 2. Verifica se torchvision e diffusers estao presentes no ambiente
"%PYTHON_EXE%" -c "import torchvision" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [IAPLAY Engine] Instalando pacote essencial torchvision...
    set PIP_REQUIRE_VIRTUALENV=false
    uv pip install "torchvision>=0.17.0" --python "%PYTHON_EXE%" >nul 2>&1 || "%PYTHON_EXE%" -m pip install "torchvision>=0.17.0"
)

"%PYTHON_EXE%" -c "import diffusers" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [IAPLAY Engine] Instalando pacote essencial diffusers...
    set PIP_REQUIRE_VIRTUALENV=false
    uv pip install "diffusers>=0.30.0" --python "%PYTHON_EXE%" >nul 2>&1 || "%PYTHON_EXE%" -m pip install "diffusers>=0.30.0"
)

REM 3. Inicia automaticamente o Ollama no PC se instalado e desligado
netstat -ano | findstr ":11434 " | findstr "LISTENING" >nul
if %ERRORLEVEL% neq 0 (
    where ollama >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [IAPLAY Engine] Iniciando servico do Ollama em segundo plano...
        start /b "" ollama serve >nul 2>&1
    ) else if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        echo [IAPLAY Engine] Iniciando servico do Ollama em segundo plano...
        start /b "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve >nul 2>&1
    ) else if exist "%ProgramFiles%\Ollama\ollama.exe" (
        echo [IAPLAY Engine] Iniciando servico do Ollama em segundo plano...
        start /b "" "%ProgramFiles%\Ollama\ollama.exe" serve >nul 2>&1
    )
)

REM 4. Verifica se o servidor YuE2 ja esta ativo na porta 42024
netstat -ano | findstr ":42024 " | findstr "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo [IAPLAY Engine] Servidor dedicado YuE2 ja esta ativo na porta 42024.
    exit /b 0
)

echo [IAPLAY Engine] Iniciando servidor dedicado YuE2 na porta 42024...
"%PYTHON_EXE%" "%~dp0yue_server.py" --port 42024 --host 127.0.0.1
