"""Crea el esquema y carga los datos demo en la base de DATABASE_URL.

Sirve para Supabase o para un PostgreSQL local sin necesidad de psql.

Uso (desde backend/ con el venv activo):
    python -m scripts.init_db             # schema.sql + seed.sql
    python -m scripts.init_db --no-seed   # solo schema.sql
    python -m scripts.init_db --check     # solo prueba la conexión
    python -m scripts.init_db --if-empty  # solo si las tablas no existen (deploy)

ATENCIÓN: schema.sql hace DROP TABLE ... CASCADE, borra los datos existentes.
--if-empty es seguro de ejecutar en cada arranque: no toca una base ya creada.
"""

import argparse
from pathlib import Path

from app.database.connection import get_connection, test_connection

DATABASE_DIR = Path(__file__).resolve().parents[2] / "database"


def run_sql_file(path: Path) -> None:
    """Ejecuta un archivo .sql completo en una sola transacción."""
    sql = path.read_text(encoding="utf-8")
    with get_connection() as conn:
        # Sin parámetros, psycopg envía el script tal cual y admite
        # varias sentencias en una misma llamada.
        conn.execute(sql)
    print(f"OK  {path.name}")


def schema_exists() -> bool:
    """Indica si la tabla users ya existe en el esquema public."""
    with get_connection() as conn:
        row = conn.execute("SELECT to_regclass('public.users') IS NOT NULL AS ok").fetchone()
    return row["ok"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Inicializa la base de datos de VetCare.")
    parser.add_argument("--no-seed", action="store_true", help="No cargar los datos demo")
    parser.add_argument("--check", action="store_true", help="Solo probar la conexión")
    parser.add_argument(
        "--if-empty", action="store_true", help="No hacer nada si las tablas ya existen"
    )
    args = parser.parse_args()

    test_connection()
    print("OK  conexión a la base de datos")
    if args.check:
        return
    if args.if_empty and schema_exists():
        print("OK  las tablas ya existen, no se modifica la base")
        return

    run_sql_file(DATABASE_DIR / "schema.sql")
    if not args.no_seed:
        run_sql_file(DATABASE_DIR / "seed.sql")


if __name__ == "__main__":
    main()
