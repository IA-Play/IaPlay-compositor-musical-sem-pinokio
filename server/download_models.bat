@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
set PIP_REQUIRE_VIRTUALENV=false
set PIP_NO_REQUIRE_VIRTUALENV=1

echo [IAPLAY Engine] Verificando ambiente Python para download dos modelos...

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

echo [IAPLAY Engine] Executando download com: %PYTHON_EXE%
"%PYTHON_EXE%" "%~dp0download_models.py"
