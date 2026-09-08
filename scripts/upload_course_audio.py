"""Sobe audios de curso (mp3) para o bucket e registra em public.media.

Uso:  python scripts/upload_course_audio.py <pasta> "<prefixo do titulo>"

Idempotente pelo caminho no bucket: reenviar sobrescreve o arquivo e nao
duplica a linha. A transcricao fica vazia e deve ser preenchida no painel,
em Midia > Editar dados.
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

BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
RATES = [44100, 48000, 32000, 0]


def mp3_duration_seconds(path: str):
    """Duracao aproximada pelo primeiro cabecalho de frame, valida para CBR."""
    try:
        data = open(path, "rb").read(200_000)
        start = 0
        if data[:3] == b"ID3":  # pula a tag ID3v2
            size = struct.unpack(">I", b"\x00" + data[6:9])[0] if False else (
                (data[6] & 0x7F) << 21 | (data[7] & 0x7F) << 14 | (data[8] & 0x7F) << 7 | (data[9] & 0x7F)
            )
            start = 10 + size
        for i in range(start, min(len(data) - 4, start + 20_000)):
            if data[i] == 0xFF and (data[i + 1] & 0xE0) == 0xE0:
                bitrate = BITRATES[(data[i + 2] >> 4) & 0x0F]
                rate = RATES[(data[i + 2] >> 2) & 0x03]
                if bitrate and rate:
                    audio_bytes = os.path.getsize(path) - start
                    return round(audio_bytes * 8 / (bitrate * 1000), 2)
        return None
    except Exception:
        return None


def call(method, path, body=None, content_type="application/json", raw=False):
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": content_type,
    }
    if raw:
        headers["x-upsert"] = "true"
    req = urllib.request.Request(f"{URL}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")


def slug(name: str) -> str:
    base = os.path.splitext(name)[0].lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base


def main() -> None:
    folder = sys.argv[1] if len(sys.argv) > 1 else None
    prefix = sys.argv[2] if len(sys.argv) > 2 else ""
    if not folder or not os.path.isdir(folder):
        sys.exit("Informe a pasta com os .mp3")

    status, body = call("GET", f"/rest/v1/media?select=id,storage_path")
    existing = {row["storage_path"]: row["id"] for row in (json.loads(body) if status == 200 else [])}

    for name in sorted(os.listdir(folder)):
        if not name.lower().endswith(".mp3"):
            continue
        path = os.path.join(folder, name)
        key = f"audio/{slug(name)}.mp3"
        blob = open(path, "rb").read()

        status, body = call("POST", f"/storage/v1/object/{BUCKET}/{key}", blob, "audio/mpeg", raw=True)
        if status not in (200, 201):
            print(f"  FALHOU upload {name}: HTTP {status} {body[:140]}")
            continue

        duration = mp3_duration_seconds(path)
        # titulo legivel a partir do nome do arquivo
        title = re.sub(r"^\d+\s*-\s*", "", os.path.splitext(name)[0])
        title = re.sub(r"\s+", " ", title).strip()
        if prefix:
            title = f"{prefix} {title}"

        if key in existing:
            call("PATCH", f"/rest/v1/media?id=eq.{existing[key]}",
                 {"title": title, "duration_seconds": duration, "size_bytes": len(blob)})
            action = "atualizado"
        else:
            status, body = call("POST", "/rest/v1/media", {
                "kind": "audio", "title": title, "storage_path": key,
                "mime_type": "audio/mpeg", "duration_seconds": duration,
                "size_bytes": len(blob), "transcript": None,
            })
            if status not in (200, 201):
                print(f"  FALHOU registro {name}: HTTP {status} {body[:140]}")
                continue
            action = "registrado"

        d = f"{duration:.0f}s" if duration else "duracao ?"
        print(f"  {action:<11} {title[:52]:<52} {len(blob)/1024:>7.0f} KB  {d}")


if __name__ == "__main__":
    main()
