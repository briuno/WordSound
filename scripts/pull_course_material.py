"""Baixa o material do curso do bucket para course-material/, para consulta local.

Uso:  python scripts/pull_course_material.py

O bucket lesson-media e a fonte da verdade do material (o anexo de chat some;
o bucket nao). Esta pasta local existe para o outro lado: ler o PDF do livro e
as paginas da apostila enquanto se escreve o conteudo de um modulo, o que nao
da para fazer com uma URL assinada.

Idempotente: arquivo com o mesmo tamanho nao e baixado de novo.

O audio e agrupado por modulo a partir do proprio nome do arquivo
('002-module-01-lesson-a-act-5-listening-a.mp3' vai para audio/module-01/),
que e a mesma informacao que diz em qual atividade do livro a faixa entra.
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
DEST = os.path.join(ROOT, "course-material")


def env(name: str) -> str:
    text = io.open(os.path.join(ROOT, ".env"), encoding="utf-8").read()
    m = re.search(r"^\s*" + name + r"\s*=\s*[\"']?([^\"'\n]+)", text, re.M)
    if not m:
        sys.exit(f"ERRO: {name} ausente no .env")
    return m.group(1).strip()


URL = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
KEY = env("SUPABASE_SERVICE_ROLE_KEY")


def api(path: str, payload: dict) -> list:
    request = urllib.request.Request(
        f"{URL}/storage/v1/{path}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {KEY}",
            "apikey": KEY,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read())


def walk(prefix: str = "") -> list:
    """Lista recursiva. A API devolve um nivel por vez; pasta vem com id nulo."""
    out = []
    offset = 0
    while True:
        page = api(
            f"object/list/{BUCKET}",
            {
                "prefix": prefix,
                "limit": 100,
                "offset": offset,
                "sortBy": {"column": "name", "order": "asc"},
            },
        )
        if not page:
            break
        for item in page:
            name = item["name"]
            full = f"{prefix}/{name}" if prefix else name
            if item.get("id") is None:
                out.extend(walk(full))
            else:
                out.append((full, (item.get("metadata") or {}).get("size")))
        if len(page) < 100:
            break
        offset += 100
    return out


def local_path(remote: str) -> str:
    """Onde o arquivo fica na pasta local, agrupado como o livro se organiza."""
    name = os.path.basename(remote)
    module = re.search(r"module[-_ ]?(\d+)", name, re.I)
    if remote.startswith("audio/"):
        folder = f"module-{int(module.group(1)):02d}" if module else "sem-modulo"
        return os.path.join(DEST, "audio", folder, name)

    unit = re.search(r"unit[-_ ]?(\d+)", name, re.I)
    if unit:
        return os.path.join(DEST, "workbook", f"unit-{int(unit.group(1)):02d}", name)
    return os.path.join(DEST, "outros", name)


def download(remote: str, target: str) -> None:
    request = urllib.request.Request(
        f"{URL}/storage/v1/object/{BUCKET}/{urllib.request.quote(remote)}",
        headers={"Authorization": f"Bearer {KEY}", "apikey": KEY},
    )
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with urllib.request.urlopen(request, timeout=300) as response:
        with open(target, "wb") as handle:
            handle.write(response.read())


def main() -> None:
    files = walk()
    if not files:
        sys.exit("ERRO: bucket vazio ou sem permissao de leitura")

    baixados = pulados = 0
    for remote, size in sorted(files):
        target = local_path(remote)
        if os.path.exists(target) and size and os.path.getsize(target) == size:
            pulados += 1
            continue
        try:
            download(remote, target)
        except urllib.error.HTTPError as error:
            print(f"  falhou {remote}: {error.code}")
            continue
        baixados += 1
        print(f"  {os.path.relpath(target, ROOT)}")

    print(f"\n{baixados} baixado(s), {pulados} ja estava(m) em dia.")
    for slot in ("book", "workbook"):
        os.makedirs(os.path.join(DEST, slot), exist_ok=True)


if __name__ == "__main__":
    main()
