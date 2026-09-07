"""Aplica os arquivos de supabase/migrations em ordem, uma transacao por arquivo.

Uso:  python scripts/migrate.py [--status]

Le DATABASE_URL do .env. Cada arquivo roda uma unica vez; o controle fica em
public.schema_migrations. A senha nunca e impressa.
"""
import os
import re
import sys
import hashlib
import urllib.parse as urlparse

import psycopg2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRATIONS_DIR = os.path.join(ROOT, "supabase", "migrations")


def load_dsn() -> str:
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        sys.exit("ERRO: .env nao encontrado")
    raw = open(path, encoding="utf-8", errors="replace").read()
    m = re.search(r"^\s*DATABASE_URL\s*=\s*[\"']?([^\"'\n]+)", raw, re.M)
    if not m:
        sys.exit("ERRO: DATABASE_URL ausente no .env")
    return m.group(1).strip()


def scrub(dsn: str, text: str) -> str:
    pw = urlparse.urlparse(dsn).password
    return text.replace(pw, "***") if pw else text


def main() -> None:
    dsn = load_dsn()
    status_only = "--status" in sys.argv

    try:
        conn = psycopg2.connect(dsn, connect_timeout=20)
    except Exception as exc:
        sys.exit("ERRO de conexao: " + scrub(dsn, str(exc).strip()))
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("""
        create table if not exists public.schema_migrations (
          filename   text primary key,
          checksum   text not null,
          applied_at timestamptz not null default now()
        )
    """)
    conn.commit()

    cur.execute("select filename, checksum from public.schema_migrations")
    applied = dict(cur.fetchall())

    files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))
    if not files:
        print("nenhuma migration encontrada")
        return

    pending = []
    for name in files:
        sql = open(os.path.join(MIGRATIONS_DIR, name), encoding="utf-8").read()
        digest = hashlib.sha256(sql.encode("utf-8")).hexdigest()[:16]
        if name in applied:
            flag = "ok" if applied[name] == digest else "ALTERADA APOS APLICADA"
            print(f"  [{flag}] {name}")
        else:
            print(f"  [pendente] {name}")
            pending.append((name, sql, digest))

    if status_only:
        return
    if not pending:
        print("\nnada a aplicar")
        return

    print()
    for name, sql, digest in pending:
        try:
            cur.execute(sql)
            cur.execute(
                "insert into public.schema_migrations (filename, checksum) values (%s, %s)",
                (name, digest),
            )
            conn.commit()
            print(f"aplicada: {name}")
        except Exception as exc:
            conn.rollback()
            print(f"FALHOU em {name}:\n  {scrub(dsn, str(exc).strip())}")
            sys.exit(1)

    conn.close()
    print("\nconcluido")


if __name__ == "__main__":
    main()
