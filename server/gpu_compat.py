"""
IAPLAY Studio - Camada Universal de Compatibilidade de GPU (NVIDIA CUDA, AMD ROCm, AMD DirectML, Apple MPS, CPU)
Garante que o motor YuE2 e o backend operem sem falhas em placas NVIDIA, AMD Radeon e CPUs.
"""

import os
import sys
import subprocess
from dataclasses import dataclass
from typing import Optional, Tuple, Dict, Any

_gpu_info_cache: Optional[Dict[str, Any]] = None
_shims_applied: bool = False


def detect_system_gpus_os() -> list[str]:
    """Detecta nomes reais das placas de vídeo instaladas no sistema operacional (Windows/Linux/macOS)."""
    gpus = []
    try:
        if sys.platform == "win32":
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
            cmd = [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=4, creationflags=flags)
            if res.returncode == 0 and res.stdout:
                for line in res.stdout.splitlines():
                    name = line.strip()
                    if name and not any(ignore in name.lower() for ignore in ["microsoft basic", "parsec", "rdpdd", "virtual desktop"]):
                        gpus.append(name)
        elif sys.platform.startswith("linux"):
            res = subprocess.run(["lspci"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0 and res.stdout:
                for line in res.stdout.splitlines():
                    if any(k in line.lower() for k in ["vga", "3d controller", "display"]):
                        parts = line.split(":", 2)
                        if len(parts) >= 3:
                            gpus.append(parts[2].strip())
    except Exception:
        pass
    return gpus


def get_gpu_info() -> Dict[str, Any]:
    """
    Retorna informações completas da GPU e do backend PyTorch ativo:
    - device_type: 'cuda' | 'dml' | 'mps' | 'cpu'
    - vendor: 'nvidia' | 'amd' | 'apple' | 'intel' | 'cpu'
    - backend: 'CUDA' | 'ROCm' | 'DirectML' | 'MPS' | 'CPU'
    - gpu_name: Nome amigável da GPU/CPU
    - torch_installed: bool
    """
    global _gpu_info_cache
    if _gpu_info_cache is not None:
        return _gpu_info_cache

    os_gpus = detect_system_gpus_os()
    amd_os_gpu = next((g for g in os_gpus if any(k in g.lower() for k in ["amd", "radeon", "advanced micro devices"])), None)
    nvidia_os_gpu = next((g for g in os_gpus if "nvidia" in g.lower() or "geforce" in g.lower() or "quadro" in g.lower() or "rtx" in g.lower() or "gtx" in g.lower()), None)
    intel_os_gpu = next((g for g in os_gpus if "intel" in g.lower() or "arc" in g.lower() or "uhd" in g.lower() or "iris" in g.lower()), None)

    try:
        import torch
    except ImportError:
        vendor = "nvidia" if nvidia_os_gpu else ("amd" if amd_os_gpu else ("intel" if intel_os_gpu else "cpu"))
        gpu_label = nvidia_os_gpu or amd_os_gpu or intel_os_gpu or "Processador (CPU - Modo Leve)"
        _gpu_info_cache = {
            "torch_installed": False,
            "device_type": "cpu",
            "vendor": vendor,
            "backend": "Modo Leve (Sem PyTorch)",
            "gpu_name": f"{gpu_label}",
            "os_gpus": os_gpus,
            "is_amd": vendor == "amd",
            "is_nvidia": vendor == "nvidia",
        }
        return _gpu_info_cache

    # 1. Verifica CUDA / ROCm (HIP)
    try:
        if torch.cuda.is_available():
            raw_name = torch.cuda.get_device_name(0)
            is_rocm = bool(getattr(torch.version, "hip", None)) or any(k in raw_name.lower() for k in ["amd", "radeon", "gfx"])
            if is_rocm:
                display_name = amd_os_gpu or raw_name
                _gpu_info_cache = {
                    "torch_installed": True,
                    "device_type": "cuda",
                    "vendor": "amd",
                    "backend": "ROCm / HIP",
                    "gpu_name": f"{display_name} (AMD ROCm)",
                    "os_gpus": os_gpus,
                    "is_amd": True,
                    "is_nvidia": False,
                }
                return _gpu_info_cache
            else:
                _gpu_info_cache = {
                    "torch_installed": True,
                    "device_type": "cuda",
                    "vendor": "nvidia",
                    "backend": "CUDA",
                    "gpu_name": f"{raw_name} (NVIDIA CUDA)",
                    "os_gpus": os_gpus,
                    "is_amd": False,
                    "is_nvidia": True,
                }
                return _gpu_info_cache
    except Exception:
        pass

    # 2. Verifica DirectML (Placas AMD Radeon e Intel Arc no Windows)
    try:
        import torch_directml
        if torch_directml.is_available():
            dml_name = ""
            try:
                dml_name = torch_directml.device_name(0)
            except Exception:
                pass
            best_name = amd_os_gpu or dml_name or intel_os_gpu or "GPU DirectX 12"
            is_amd = bool(amd_os_gpu) or any(k in best_name.lower() for k in ["amd", "radeon"])
            vendor = "amd" if is_amd else ("intel" if "intel" in best_name.lower() else "amd")
            _gpu_info_cache = {
                "torch_installed": True,
                "device_type": "dml",
                "vendor": vendor,
                "backend": "DirectML",
                "gpu_name": f"{best_name} (DirectML)",
                "os_gpus": os_gpus,
                "is_amd": is_amd,
                "is_nvidia": False,
            }
            return _gpu_info_cache
    except ImportError:
        pass
    except Exception:
        pass

    # 3. Verifica Apple Silicon (MPS)
    try:
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            _gpu_info_cache = {
                "torch_installed": True,
                "device_type": "mps",
                "vendor": "apple",
                "backend": "Apple Metal (MPS)",
                "gpu_name": "Apple Silicon (MPS)",
                "os_gpus": os_gpus,
                "is_amd": False,
                "is_nvidia": False,
            }
            return _gpu_info_cache
    except Exception:
        pass

    # 4. Fallback CPU (mas informa se detectou uma GPU AMD ou NVIDIA no sistema)
    if amd_os_gpu:
        gpu_name = f"{amd_os_gpu} (Modo Compatibilidade CPU)"
        vendor = "amd"
    elif nvidia_os_gpu:
        gpu_name = f"{nvidia_os_gpu} (Modo Compatibilidade CPU)"
        vendor = "nvidia"
    elif intel_os_gpu:
        gpu_name = f"{intel_os_gpu} (CPU)"
        vendor = "intel"
    else:
        gpu_name = "Processador (CPU)"
        vendor = "cpu"

    _gpu_info_cache = {
        "torch_installed": True,
        "device_type": "cpu",
        "vendor": vendor,
        "backend": "CPU",
        "gpu_name": gpu_name,
        "os_gpus": os_gpus,
        "is_amd": vendor == "amd",
        "is_nvidia": vendor == "nvidia",
    }
    return _gpu_info_cache


@dataclass
class _DummyDeviceProperties:
    name: str = "Compatible Accelerator"
    major: int = 8
    minor: int = 0
    total_memory: int = 16 * 1024 * 1024 * 1024  # 16 GB virtual budget
    multi_processor_count: int = 32


class _DummyStream:
    def synchronize(self):
        pass

    def record_event(self, event=None):
        pass


class _DummyEvent:
    def __init__(self, enable_timing: bool = False, **kwargs):
        self.enable_timing = enable_timing

    def record(self, stream=None):
        pass

    def synchronize(self):
        pass

    def elapsed_time(self, other) -> float:
        return 0.0


def apply_torch_cuda_compat_shims():
    """
    Aplica shims de segurança em `torch.cuda` quando o sistema roda em placas AMD (DirectML/ROCm),
    Apple MPS ou CPU, evitando falhas em chamadas como `torch.cuda.get_device_capability()`
    ou `torch.cuda.get_device_properties()` dentro do motor YuE2 / wgp.
    """
    global _shims_applied
    if _shims_applied:
        return

    try:
        import torch
    except ImportError:
        return

    _shims_applied = True
    info = get_gpu_info()

    # Se CUDA real (NVIDIA ou AMD ROCm) estiver ativo, apenas protege get_device_capability e get_device_properties contra exceções
    if torch.cuda.is_available():
        orig_cap = getattr(torch.cuda, "get_device_capability", None)
        if callable(orig_cap):
            def _safe_cap(device=None):
                try:
                    return orig_cap(device)
                except Exception:
                    return (8, 0)
            torch.cuda.get_device_capability = _safe_cap

        orig_props = getattr(torch.cuda, "get_device_properties", None)
        if callable(orig_props):
            def _safe_props(device=None):
                try:
                    return orig_props(device if device is not None else 0)
                except Exception:
                    return _DummyDeviceProperties(name=info.get("gpu_name", "GPU"))
            torch.cuda.get_device_properties = _safe_props
        return

    # Quando torch.cuda.is_available() é False (AMD DirectML, Apple MPS, ou CPU):
    # Protege todas as funções de consulta de hardware do torch.cuda para que wgp.py e mmgp não quebrem na importação
    dummy_props = _DummyDeviceProperties(name=info.get("gpu_name", "Compatible Device"))

    torch.cuda.get_device_capability = lambda device=None: (8, 0)
    torch.cuda.get_device_properties = lambda device=None: dummy_props
    torch.cuda.get_device_name = lambda device=None: info.get("gpu_name", "CPU")
    torch.cuda.current_device = lambda: 0
    torch.cuda.device_count = lambda: 1
    torch.cuda.set_device = lambda device: None
    torch.cuda.empty_cache = lambda: None
    torch.cuda.synchronize = lambda device=None: None
    torch.cuda.ipc_collect = lambda: None
    torch.cuda.manual_seed = lambda seed: torch.manual_seed(seed)
    torch.cuda.manual_seed_all = lambda seed: torch.manual_seed(seed)
    torch.cuda.reset_peak_memory_stats = lambda device=None: None
    torch.cuda.max_memory_allocated = lambda device=None: 0
    torch.cuda.memory_allocated = lambda device=None: 0
    torch.cuda.memory_reserved = lambda device=None: 0
    torch.cuda.mem_get_info = lambda device=None: (12 * 1024**3, 16 * 1024**3)
    torch.cuda.memory_stats = lambda device=None: {"allocated_bytes.all.current": 0}
    torch.cuda.is_current_stream_capturing = lambda: False
    torch.cuda.current_stream = lambda device=None: _DummyStream()
    torch.cuda.Event = _DummyEvent


def ensure_pytorch_installed(progress_callback=None) -> bool:
    """
    Se o usuário instalou no Modo Leve (sem PyTorch) e decidir baixar os modelos YuE2 depois,
    instala automaticamente a versão ideal do PyTorch para a placa de vídeo detectada (NVIDIA, AMD ou CPU).
    """
    global _gpu_info_cache
    try:
        import torch
        return True
    except ImportError:
        pass

    info = get_gpu_info()
    vendor = info.get("vendor", "cpu")
    if progress_callback:
        progress_callback(f"Instalando motor PyTorch para {vendor.upper()}...")

    print(f"[IAPLAY GPU] PyTorch não detectado (Modo Leve). Instalando automaticamente para hardware: {vendor.upper()}...")
    cmd = [sys.executable, "-m", "pip", "install"]
    if vendor == "nvidia":
        cmd.extend(["torch", "torchvision", "torchaudio", "--index-url", "https://download.pytorch.org/whl/cu124"])
    elif vendor == "amd":
        if sys.platform.startswith("linux"):
            cmd.extend(["torch", "torchvision", "torchaudio", "--index-url", "https://download.pytorch.org/whl/rocm6.2"])
        else:
            cmd.extend(["torch", "torch-directml", "torchvision", "torchaudio", "numpy==1.26.4"])
    else:
        cmd.extend(["torch", "torchvision", "torchaudio", "--index-url", "https://download.pytorch.org/whl/cpu"])

    try:
        subprocess.run(cmd, check=False)
        _gpu_info_cache = None
        apply_torch_cuda_compat_shims()
        import torch
        return True
    except Exception as e:
        print(f"[IAPLAY GPU] Aviso ao instalar PyTorch automaticamente: {e}")
        return False

