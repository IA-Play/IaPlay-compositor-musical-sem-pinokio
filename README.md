<div align="center">

# 🎵 IAPLAY Studio — Estúdio de Música & IA Neural (Versão Standalone)

**Composição lírica avançada, engenharia de prompts Suno/Udio/Mureka e geração musical neural local com YuE2 3B e SheetSage2.**  
*Versão autônoma e independente — Não requer o aplicativo Pinokio.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![YuE2 3B](https://img.shields.io/badge/Engine-YuE2_3B_Neural-purple?style=for-the-badge)](https://github.com/IA-Play/compositor-musical-iaplay)

[🚀 Instalação Rápida](#-instalação-rápida) • [▶️ Como Iniciar](#-como-iniciar) • [✨ Funcionalidades](#-principais-funcionalidades) • [💻 Requisitos](#-requisitos-de-hardware) • [📡 API Local](#-documentação-da-api-local)

</div>

---

## 📖 Sobre o IAPLAY Studio

O **IAPLAY Studio** é uma estação de trabalho de áudio e inteligência artificial completa:
1. **Copiloto Lírico e de Prompts:** Gera letras estruturadas com metatags precisas (`[Verse]`, `[Chorus]`, `[Bridge]`, etc.) e prompts de estilo de alta fidelidade calibrados para Suno, Udio e Mureka.
2. **Geração Musical Neural Local (YuE2 3B):** Gera músicas completas (vocais + instrumental) em alta resolução diretamente na sua placa de vídeo (NVIDIA CUDA), de forma 100% gratuita, privada e ilimitada.
3. **Criação de Covers & Transcrição (SheetSage2):** Carregue um áudio de referência (.mp3, .wav, .m4a) para extrair harmonia e melodia guia automaticamente.
4. **Humanizador de Áudio & Anti-Detecção:** Remove artefatos de IA, normaliza dinâmica e limpa assinaturas para distribuição em plataformas.
5. **Duração Expandida:** Geração de até 10 minutos (600 segundos) de música contínua.

---

## 💻 Requisitos do Sistema

- **Sistema Operacional:** Windows 10/11 (64-bit), Linux (Ubuntu/Debian recomendado) ou macOS.
- **Node.js:** Versão 18+ (LTS recomendada). [Baixar Node.js](https://nodejs.org/)
- **Python:** Versão 3.10 ou 3.11. [Baixar Python](https://python.org/) *(Marque "Add Python to PATH")*
- **Placa de Vídeo (Opcional para IA local):**
  - **Recomendado:** Placa NVIDIA com 6 GB+ de VRAM (suporte a CUDA).
  - **Mínimo:** 16 GB de memória RAM caso opte por rodar em modo CPU.

---

## 🚀 Instalação Rápida

### No Windows:
1. Clone o repositório ou baixe o código-fonte:
   ```bash
   git clone https://github.com/SEU-USUARIO/IAPLAY-SEM-PINOKIO.git
   cd IAPLAY-SEM-PINOKIO
   ```
2. Dê **dois cliques** no arquivo:
   ```
   instalar.bat
   ```
   *O instalador criará o ambiente virtual Python (`env`), instalará os pacotes do PyTorch com suporte a CUDA (se tiver placa NVIDIA) e baixará os modelos neurais YuE2 automaticamente.*

### No Linux / macOS:
```bash
git clone https://github.com/SEU-USUARIO/IAPLAY-SEM-PINOKIO.git
cd IAPLAY-SEM-PINOKIO
chmod +x instalar.sh iniciar.sh
./instalar.sh
```

---

## ▶️ Como Iniciar

### No Windows:
Dê **dois cliques** no arquivo:
```
iniciar.bat
```
*O script iniciará o servidor de IA YuE2 na porta `42024`, subirá a interface web e abrirá seu navegador padrão automaticamente em `http://localhost:5173`.*

Para encerrar os serviços, execute:
```
parar.bat
```

### No Linux / macOS:
```bash
./iniciar.sh
```

---

## 🛠️ Inicialização Manual (Via Terminal)

Se preferir rodar manualmente em dois terminais:

#### Terminal 1 — Servidor YuE2 (Backend):
```bash
# Windows
.\env\Scripts\activate
python server\yue_server.py --port 42024 --host 127.0.0.1

# Linux / Mac
source env/bin/activate
python server/yue_server.py --port 42024 --host 127.0.0.1
```

#### Terminal 2 — Interface Web (Frontend):
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5173`

---

## 📡 Documentação da API Local

O motor neural opera na porta local `42024`:

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/health` | Status de saúde do motor YuE2 e GPU |
| `GET` | `/api/v1/models/status` | Verifica quais pesos neurais estão presentes |
| `POST` | `/api/v1/models/download` | Inicia download direto dos pesos do Hugging Face |
| `POST` | `/api/v1/generate` | Dispara geração de música neural |
| `GET` | `/api/v1/jobs/{job_id}` | Consulta progresso da renderização de áudio |
| `POST` | `/api/v1/humanize` | Aplica o processamento anti-detecção e masterização |

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
Criado com ❤️ pela comunidade **IA-Play**.
