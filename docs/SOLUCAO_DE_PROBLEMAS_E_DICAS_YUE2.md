# Solução de problemas e dicas do YuE2

Guia para quem instala o IAPLAY Studio e para quem desenvolve o projeto. Reúne os problemas encontrados ao instalar
numa **NVIDIA RTX 5080 (Windows 11, Python 3.13)**, o que foi corrigido em cada um e o que aprendemos a usar o YuE2
em produção musical.

---

## 1. Problemas de instalação (e o que mudou)

### 1.1 Placas RTX 50 (Blackwell): "CUDA capability sm_120 is not compatible"

**Sintoma:** ao iniciar, aparece

```
NVIDIA GeForce RTX 5080 with CUDA capability sm_120 is not compatible with the current PyTorch installation.
```

e a GPU fica parada (0%) na geração.

**Causa:** o instalador sempre baixava o PyTorch do índice `cu124`, que não tem kernels para as RTX 50 (`sm_120`).

**O que mudou:**
- `instalar.bat` lê a *compute capability* da placa (`nvidia-smi --query-gpu=compute_cap`). Com capability 10 ou
  maior (RTX 50 / Blackwell), instala o PyTorch `cu128`; nas outras placas continua o `cu124` de sempre (nada muda para
  GTX 10xx, RTX 20/30/40).
- `iniciar.bat` confere, a cada início, se o PyTorch instalado suporta a placa. Se não suportar (por exemplo, uma
  instalação antiga numa RTX 50), atualiza sozinho para `cu128`. A conferência respeita a compatibilidade binária do
  CUDA, então uma RTX 40 (sm_89) com `cu124` (sm_86) **não** dispara o aviso.

**Correção manual (se precisar):**
```
env\Scripts\python.exe -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
```

### 1.2 Interface não abre: "listen EACCES: permission denied ::1:5173"

**Causa:** o Windows (Hyper-V, WSL, Docker) reserva faixas de portas que variam de PC para PC. No PC testado, a faixa
5094–5193 estava reservada e incluía a 5173. Nesse caso o Vite não tenta outra porta sozinho. Para ver as faixas
reservadas: `netsh interface ipv4 show excludedportrange protocol=tcp`.

**O que mudou:** o `vite.config.ts` agora usa a primeira porta livre da lista `5173, 5600, 4173, 3000, 8080`. Onde a
5173 funciona, nada muda. O endereço certo aparece no terminal (`Local: http://localhost:...`) e o navegador abre sozinho.

### 1.3 O motor inicia mas não gera nada (GPU em 0%, erro só no log)

Na geração, o motor carrega o `engine/wgp.py`. Três motivos faziam esse carregamento falhar sem aviso na interface:

| Erro no log | Causa | Correção no `server/requirements.txt` |
|---|---|---|
| `No module named 'ffmpeg'` (depois `imageio`, `piexif`, `av`) | pacotes importados pelo motor que não estavam no requirements | `ffmpeg-python`, `imageio`, `imageio-ffmpeg`, `piexif`, `av` |
| `Incorrect version of mmgp (3.8.2), version 3.7.12 is needed` | o requirements pedia `mmgp>=3.7.0`, mas o `wgp.py` exige **exatamente** 3.7.12 e encerra com `exit()` | `mmgp==3.7.12` |
| `nano-vllm is not available ... No module named 'xxhash'` | o executor do modelo de linguagem usa `xxhash` | `xxhash` |

### 1.4 Modo "Extract Score from Source Song" (SheetSage2) falha

**Sintoma:** `BartDecoder.__init__() got an unexpected keyword argument 'embed_tokens'`, e depois outros erros no
`modeling_sheetsage2.py` (`_tied_weights_keys`, `tie_weights(recompute_mapping=...)`).

**Causa:** o código do SheetSage2 foi escrito para o `transformers` 4.x, e o requirements (`>=4.40`) deixava instalar o
5.x, que mudou essas APIs. O modo Direct não usa o SheetSage2, por isso continuava funcionando.

**O que mudou:** `transformers>=4.53,<5` e `diffusers>=0.34,<0.36` (o `diffusers` 0.43 exige `huggingface_hub` 1.x, que
não é compatível com o `transformers` 4.x). Testado: com a mesma seed, o modo Direct gera um áudio **idêntico** (mesmo
MD5) antes e depois da troca, e o Extract passa a funcionar.

---

## 2. Dicas para tirar o melhor do YuE2

Aprendido em quatro rodadas de testes, comparando com outro motor de música local, usando letras reais (power metal
a 152 BPM e power ballad a 72 BPM).

### Letra (campo `prompt`)
- Use só as palavras cantadas e etiquetas simples em linhas próprias: `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Chorus]`,
  `[Bridge]`, `[Outro]`, com uma linha em branco entre as seções.
- **Não** coloque instruções de produção, voz, instrumentos ou BPM dentro da letra (por exemplo,
  `[Verse 1 - gruff male vocal, steady march]`). O próprio YuE2 recomenda deixar isso no estilo
  (`engine/models/TTS/yue2/prompt_enhancers.py`), e o motor não interpreta essas tags.
- Seções só instrumentais (solo, build) não têm etiqueta própria: peça o solo no estilo.

### Estilo (campo `alt_prompt`)
- Ordem que funcionou melhor: **voz → gênero → instrumentos → clima → tom e BPM**. Começar pela voz é o que a fixa.
  Exemplo: `Deep raspy gravelly male baritone lead vocal, huge shouted gang vocal choir on every chorus, English epic
  power metal battle anthem, heavy palm-muted distorted guitars, galloping double-kick drums, bombastic keyboards,
  massive choir, triumphant, E minor, 152 BPM`.
- Para voz feminina, diga explicitamente ("Powerful female lead vocal..."). Sem isso, pode sair voz masculina.

### Duração (`duration_seconds`) é um TETO, não a duração pedida
- O motor termina a música sozinho, com um final natural. Se o teto for curto, a música é **cortada no meio**.
- Exemplo real: 26 linhas a 152 BPM precisaram de ~3:57. Com 150 s cortou no meio da letra; com 210 s cortou o outro;
  com 240 s terminou sozinha aos 237,6 s.
- Sinal de corte: o arquivo tem exatamente a duração do teto e o volume continua alto no último meio segundo. Aumente o
  teto e repita a mesma seed.

### Modo Extract: versões acústica, ao vivo, piano...
- `model_mode=0` (melodia e acordes) ou `1` (só melodia), com `audio_guide` apontando para uma gravação e
  `audio_prompt_type="A"`. O SheetSage2 transcreve a gravação para partitura ABC (detectou certo o tom, Ré menor, e a
  estrutura) e o YuE2 canta a letra por cima.
- Mantém o andamento e a melodia: nos testes, a voz e o refrão entraram a 1–2 s do original. Ótimo para criar versões
  (acústica, ao vivo, piano, orquestral) de uma música já pronta, trocando só o estilo.
- A letra precisa seguir a **mesma ordem de seções** da gravação (a transcrição extrai notas, não palavras).

### Outras observações
- As etiquetas com tempo (`[Verse 0:12-0:40]`) só funcionam no modo instrumental (`instrumental.py`); numa música
  cantada são ignoradas.
- A mesma seed com a mesma letra, estilo e ambiente gera o mesmo áudio (confirmado por MD5). Para comparar receitas,
  mude uma coisa de cada vez.
- Desempenho numa RTX 5080: ~10 s para carregar os modelos no primeiro job, ~1 s de geração por segundo de música,
  6,4 a 10,8 GB de VRAM. Um ComfyUI aberto ocupa ~6 GB: feche-o ou libere a memória dele antes.

---

## 3. Licença dos pesos

A cópia em `engine/models/TTS/yue2/MODEL_LICENSE` traz só o CC BY-NC 4.0. O `MODEL_LICENSE` oficial
(github.com/multimodal-art-projection/YuE) acrescentou em 16/09/2026 uma **"Individual creator permission"**: pessoas
físicas (músicos, criadores de conteúdo) podem publicar e monetizar as músicas geradas sem taxas; empresas devem pedir
uma licença comercial aos autores. Leia o texto oficial antes de publicar. Os pesos do MERT-v2, usados no Extract, têm
uma CC BY-NC própria.
