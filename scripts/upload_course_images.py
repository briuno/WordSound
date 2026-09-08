"""Sobe imagens do livro (png/jpg/webp) para o bucket e registra em public.media.

Uso:  python scripts/upload_course_images.py <pasta> "<prefixo do titulo>"

Idempotente pelo caminho no bucket: reenviar sobrescreve o arquivo e nao
duplica a linha. Depois de subir, ligue a imagem ao bloco no painel, em
Licao > bloco > Imagem.

O nome do arquivo vira o titulo, entao vale nomear pensando na busca do painel:
"u1-l04-profissoes.png" fica melhor que "IMG_0042.png".
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKET = "lesson-media"

# so o que o painel ja aceita no upload manual (app/admin/actions.ts)
MIME_BY_EXT = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def env(name: str) -> str:
    text = io.open(os.path.join(ROOT, ".env"), encoding="utf-8").read()
    m = re.search(r"^\s*" + name + r"\s*=\s*[\"']?([^\"'\n]+)", text, re.M)
    if not m:
        sys.exit(f"ERRO: {name} ausente no .env")
    return m.group(1).strip()


URL = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
KEY = env("SUPABASE_SERVICE_ROLE_KEY")


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
        sys.exit("Informe a pasta com as imagens (png, jpg ou webp)")

    status, body = call("GET", "/rest/v1/media?select=id,storage_path")
    existing = {row["storage_path"]: row["id"] for row in (json.loads(body) if status == 200 else [])}

    found = 0
    for name in sorted(os.listdir(folder)):
        ext = os.path.splitext(name)[1].lower()
        mime = MIME_BY_EXT.get(ext)
        if not mime:
            continue
        found += 1

        path = os.path.join(folder, name)
        key = f"images/{slug(name)}{ext}"
        blob = open(path, "rb").read()

        status, body = call("POST", f"/storage/v1/object/{BUCKET}/{key}", blob, mime, raw=True)
        if status not in (200, 201):
            print(f"  FALHOU upload {name}: HTTP {status} {body[:140]}")
            continue

        # titulo legivel a partir do nome do arquivo
        title = re.sub(r"^\d+\s*-\s*", "", os.path.splitext(name)[0])
        title = re.sub(r"[-_]+", " ", title)
        title = re.sub(r"\s+", " ", title).strip()
        if prefix:
            title = f"{prefix} {title}"

        if key in existing:
            call("PATCH", f"/rest/v1/media?id=eq.{existing[key]}",
                 {"title": title, "size_bytes": len(blob), "mime_type": mime})
            action = "atualizada"
        else:
            status, body = call("POST", "/rest/v1/media", {
                "kind": "image", "title": title, "storage_path": key,
                "mime_type": mime, "size_bytes": len(blob),
            })
            if status not in (200, 201):
                print(f"  FALHOU registro {name}: HTTP {status} {body[:140]}")
                continue
            action = "registrada"

        print(f"  {action:<11} {title[:52]:<52} {len(blob)/1024:>7.0f} KB")

    if found == 0:
        print("Nenhuma imagem png, jpg ou webp na pasta.")


if __name__ == "__main__":
    main()
