"""Cria o bucket de midia e sobe os audios demo da licao de listening.

Uso:  python scripts/upload_demo_audio.py <pasta-com-wavs>

Idempotente: o bucket so e criado se faltar, e cada arquivo e sobrescrito.
Le as chaves do .env e nunca as imprime.
"""
import io
import json
import os
import re
import struct
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKET = "lesson-media"


def env(name: str) -> str:
    text = io.open(os.path.join(ROOT, ".env"), encoding="utf-8").read()
    m = re.search(r"^\s*" + name + r"\s*=\s*[\"']?([^\"'\n]+)", text, re.M)
    if not m:
        sys.exit(f"ERRO: {name} ausente no .env")
    return m.group(1).strip()


URL = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
KEY = env("SUPABASE_SERVICE_ROLE_KEY")


def call(method: str, path: str, body=None, content_type="application/json", raw=False):
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(
        f"{URL}{path}",
        data=data,
        method=method,
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": content_type,
            **({"x-upsert": "true"} if raw else {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, (r.read().decode(errors="replace") or "")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")


def wav_duration_seconds(path: str) -> float:
    """Le sample rate e byte rate direto do cabecalho RIFF."""
    with open(path, "rb") as f:
        head = f.read(44)
    if head[:4] != b"RIFF" or head[8:12] != b"WAVE":
        return 0.0
    byte_rate = struct.unpack("<I", head[28:32])[0]
    size = os.path.getsize(path) - 44
    return round(size / byte_rate, 2) if byte_rate else 0.0


def main() -> None:
    folder = sys.argv[1] if len(sys.argv) > 1 else None
    if not folder or not os.path.isdir(folder):
        sys.exit("Informe a pasta com os arquivos .wav")

    status, body = call("POST", "/storage/v1/bucket", {
        "name": BUCKET,
        "id": BUCKET,
        "public": False,
        "file_size_limit": 26214400,  # 25 MB
        "allowed_mime_types": ["audio/wav", "audio/mpeg", "audio/mp4", "audio/x-m4a", "image/png", "image/jpeg", "image/webp"],
    })
    if status in (200, 201):
        print(f"bucket '{BUCKET}' criado")
    elif "already exists" in body.lower() or status == 409:
        print(f"bucket '{BUCKET}' ja existia")
    else:
        sys.exit(f"ERRO ao criar bucket: HTTP {status} {body[:200]}")

    results = []
    for name in sorted(os.listdir(folder)):
        if not name.lower().endswith(".wav"):
            continue
        path = os.path.join(folder, name)
        blob = open(path, "rb").read()
        key = f"audio/{name}"
        status, body = call("POST", f"/storage/v1/object/{BUCKET}/{key}", blob, "audio/wav", raw=True)
        if status not in (200, 201):
            print(f"  FALHOU {name}: HTTP {status} {body[:160]}")
            continue
        duration = wav_duration_seconds(path)
        results.append({"path": key, "bytes": len(blob), "duration": duration})
        print(f"  enviado {name:<28} {len(blob):>8,} bytes  {duration:>6.2f}s")

    out = os.path.join(ROOT, "scripts", "uploaded_audio.json")
    io.open(out, "w", encoding="utf-8").write(json.dumps(results, indent=2))
    print(f"\n{len(results)} arquivo(s). Manifesto em scripts/uploaded_audio.json")


if __name__ == "__main__":
    main()
