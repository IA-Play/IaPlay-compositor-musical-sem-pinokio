#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "===================================================================="
echo "  IAPLAY STUDIO - Instalador Automatizado (Linux / macOS)"
echo "===================================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js nao encontrado. Por favor instale o Node.js."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "[ERRO] Python3 nao encontrado. Por favor instale o Python 3.10 ou 3.11."
    exit 1
fi

if [ ! -d "$SCRIPT_DIR/env" ]; then
    echo "[1/4] Criando ambiente virtual Python 'env'..."
    python3 -m venv "$SCRIPT_DIR/env"
fi

PYTHON_EXE="$SCRIPT_DIR/env/bin/python"

echo "[2/4] Instalando PyTorch..."
if command -v nvidia-smi &> /dev/null; then
    "$PYTHON_EXE" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
else
    "$PYTHON_EXE" -m pip install torch torchvision torchaudio
fi

echo "[3/4] Instalando dependencias do servidor..."
"$PYTHON_EXE" -m pip install -r "$SCRIPT_DIR/server/requirements.txt"

echo "[4/4] Instalando dependencias do frontend (Node.js)..."
npm install

echo "Verificando e baixando modelos YuE2..."
"$PYTHON_EXE" "$SCRIPT_DIR/server/download_models.py"

echo ""
echo "===================================================================="
echo "  Instalacao concluida! Execute './iniciar.sh' para abrir o IAPLAY."
echo "===================================================================="
