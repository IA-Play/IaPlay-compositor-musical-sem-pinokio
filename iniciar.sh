#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "===================================================================="
echo "  IAPLAY STUDIO - Compositor Musical com IA (Versao Standalone)"
echo "===================================================================="
echo ""

PYTHON_EXE=""
if [ -f "$SCRIPT_DIR/env/bin/python" ]; then
    PYTHON_EXE="$SCRIPT_DIR/env/bin/python"
elif command -v python3 &>/dev/null; then
    PYTHON_EXE="python3"
elif command -v python &>/dev/null; then
    PYTHON_EXE="python"
fi

if [ -z "$PYTHON_EXE" ]; then
    echo "[ERRO] Python nao encontrado! Execute primeiro './instalar.sh'."
    exit 1
fi

if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "[IAPLAY] Instalando dependencias web com npm..."
    npm install
fi

# Verifica porta 42024
if ! lsof -i:42024 &>/dev/null; then
    echo "[1/2] Iniciando motor de IA YuE2 na porta 42024..."
    "$PYTHON_EXE" "$SCRIPT_DIR/server/yue_server.py" --port 42024 --host 127.0.0.1 &
    sleep 3
else
    echo "[1/2] Motor de IA YuE2 ja esta ativo na porta 42024."
fi

echo "[2/2] Iniciando interface grafica IAPLAY Studio..."
echo ""
echo "===================================================================="
echo "  IAPLAY Studio pronto! Abra: http://localhost:5173"
echo "  Pressione Ctrl+C para encerrar."
echo "===================================================================="
echo ""

npm run dev -- --open
