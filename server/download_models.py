"""
IAPLAY Studio - Script de Download Direto de Modelos YuE2 & SheetSage2
Baixa os pesos neurais oficiais do YuE2 3B e SheetSage2 diretamente para a pasta ckpts do IAPLAY.
Pode ser executado via Pinokio ou via linha de comando.
"""

import os
import sys
import json
import time

if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from huggingface_hub import hf_hub_download

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CKPTS_DIR = os.path.join(ROOT_DIR, "ckpts")
ENGINE_DIR = os.path.join(ROOT_DIR, "engine")
os.makedirs(CKPTS_DIR, exist_ok=True)

HF_REPO_ID = "DeepBeepMeep/TTS"
HF_REVISION = "864a479cbf3e810e1b2c1993b438510750e383b2"

FILES_TO_DOWNLOAD = [
    ("YuE2_AR/YuE2_AR_int8_convrot.safetensors", "Peso Auto-Regressivo YuE2 AR (Int8)", 2925023698),
    ("YuE2_AR/qwen.tiktoken", "Tokenizador Qwen Vocab", 2561218),
    ("YuE2_Acoustic_int8_convrot.safetensors", "Peso Acústico DiT Flow (Int8)", 1522568148),
    ("yue2/YuE2_VAE_bf16.safetensors", "Decodificador VAE 48kHz Stereo", 132731320),
    ("yue2/vae_config.json", "Configuração do VAE", 1378),
    ("sheetsage2/SheetSage2_MERT2_bf16.safetensors", "Modelo SheetSage2 MERT2 (Cover / Transcrição de Áudio)", 1354429922),
]

QWEN_CONFIG_DATA = {
    "_class_name": "AutoencoderKLQwenImage",
    "_diffusers_version": "0.34.0.dev0",
    "attn_scales": [],
    "base_dim": 96,
    "dim_mult": [1, 2, 4, 4],
    "dropout": 0.0,
    "latents_mean": [
        -0.7571, -0.7089, -0.9113, 0.1075, -0.1745, 0.9653, -0.1517, 1.5508,
        0.4134, -0.0715, 0.5517, -0.3632, -0.1922, -0.9497, 0.2503, -0.2921
    ],
    "latents_std": [
        2.8184, 1.4541, 2.3275, 2.6558, 1.2196, 1.7708, 2.6052, 2.0743,
        3.2687, 2.1526, 2.8652, 1.5579, 1.6382, 1.1253, 2.8251, 1.916
    ],
    "num_res_blocks": 2,
    "temperal_downsample": [False, True, True],
    "z_dim": 16
}


def ensure_engine_ckpts_link():
    """Garante que a pasta engine/ckpts aponte para ckpts."""
    if not os.path.exists(ENGINE_DIR):
        return
    engine_ckpts = os.path.join(ENGINE_DIR, "ckpts")
    if not os.path.exists(engine_ckpts):
        try:
            if sys.platform == "win32":
                import subprocess
                subprocess.run(f'cmd /c mklink /J "{engine_ckpts}" "{CKPTS_DIR}"', shell=True, check=False)
            else:
                os.symlink(CKPTS_DIR, engine_ckpts)
            print(f"[IAPLAY Engine] Link simbólico criado: {engine_ckpts} -> {CKPTS_DIR}")
        except Exception as e:
            print(f"[IAPLAY Engine] Aviso ao vincular engine/ckpts: {e}")


def format_bytes(bytes_val: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TB"


def download_all():
    print("=" * 70)
    print("  IAPLAY Studio - Download Direto dos Modelos YuE2 3B & SheetSage2")
    print(f"  Destino: {CKPTS_DIR}")
    print(f"  Repositório Hugging Face: {HF_REPO_ID} (rev: {HF_REVISION[:8]}...)")
    print("=" * 70)

    # 1. Garante qwen_vae_config.json
    qwen_cfg_path = os.path.join(CKPTS_DIR, "qwen_vae_config.json")
    if not os.path.isfile(qwen_cfg_path):
        with open(qwen_cfg_path, "w", encoding="utf-8") as f:
            json.dump(QWEN_CONFIG_DATA, f, indent=2)
        print("  ✓ Criado arquivo base qwen_vae_config.json")

    total_files = len(FILES_TO_DOWNLOAD)
    total_bytes = sum(size for _, _, size in FILES_TO_DOWNLOAD)

    print(f"Total a baixar: {total_files} arquivos ({format_bytes(total_bytes)})\n")

    for i, (rel_path, desc, expected_size) in enumerate(FILES_TO_DOWNLOAD, 1):
        target_path = os.path.join(CKPTS_DIR, rel_path)
        print(f"[{i}/{total_files}] Verificando {desc}...")

        if os.path.isfile(target_path) and os.path.getsize(target_path) >= (expected_size * 0.95):
            size_mb = os.path.getsize(target_path) / (1024 * 1024)
            print(f"       ✓ Arquivo já existe e está completo ({size_mb:.1f} MB). Pulando.")
            continue

        print(f"       ⬇ Baixando {rel_path} ({format_bytes(expected_size)})...")
        start_time = time.time()

        dest_dir = os.path.dirname(target_path)
        os.makedirs(dest_dir, exist_ok=True)

        hf_hub_download(
            repo_id=HF_REPO_ID,
            revision=HF_REVISION,
            filename=rel_path,
            local_dir=CKPTS_DIR
        )

        elapsed = max(0.1, time.time() - start_time)
        actual_size = os.path.getsize(target_path) if os.path.isfile(target_path) else expected_size
        speed = (actual_size / (1024 * 1024)) / elapsed
        print(f"       ✓ Concluído em {elapsed:.1f}s ({speed:.1f} MB/s)!")

    # 2. Garante o link simbólico / junção para o motor YuE2
    ensure_engine_ckpts_link()

    print("\n" + "=" * 70)
    print("  Todos os pesos do YuE2 e SheetSage2 foram instalados com sucesso no IAPLAY!")
    print("  Agora você pode iniciar o IAPLAY e gerar músicas neurais nativamente.")
    print("=" * 70)


if __name__ == "__main__":
    download_all()
