from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import duckdb
import psycopg2
from psycopg2.extras import Json, execute_values


BATCH_SIZE = 500
TOP_LOCALIDADES = 12
ORIGEM = "ibge_enderecos"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


def load_env() -> None:
    cwd = Path.cwd()
    load_env_file(cwd / ".env.local")
    load_env_file(cwd / ".env")


def sql_path(path: Path) -> str:
    return path.resolve().as_posix().replace("'", "''")


def as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Importa a base IBGE de enderecos/CEP de MS para a tabela agregada ceps_ms."
    )
    parser.add_argument(
        "parquet",
        nargs="?",
        help="Caminho do arquivo Parquet. Tambem pode vir de IBGE_CEPS_MS_PARQUET_PATH.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Calcula os agregados, mas nao grava no banco.",
    )
    return parser


def fetch_aggregates(parquet_path: Path) -> list[tuple[Any, ...]]:
    con = duckdb.connect(database=":memory:")
    base = f"read_parquet('{sql_path(parquet_path)}')"
    where_ms = "sigla_uf = 'MS' and regexp_matches(cep, '^[0-9]{8}$')"

    main_rows = con.execute(
        f"""
        select
          cep,
          any_value(sigla_uf) as uf,
          any_value(id_municipio) as ibge_municipio_id,
          any_value(id_municipio_nome) as cidade,
          count(*) as total_registros,
          count(distinct localidade) as localidades_count,
          count(distinct nome_logradouro) as logradouros_count,
          avg(try_cast(latitude as double)) as latitude,
          avg(try_cast(longitude as double)) as longitude
        from {base}
        where {where_ms}
        group by cep
        order by cep
        """
    ).fetchall()

    localidade_rows = con.execute(
        f"""
        select cep, localidade, count(*) as registros
        from {base}
        where {where_ms}
        group by cep, localidade
        order by cep, registros desc, localidade
        """
    ).fetchall()

    logradouro_rows = con.execute(
        f"""
        with counts as (
          select
            cep,
            regexp_replace(
              trim(concat_ws(' ', tipo_segmento_logradouro, titulo_segmento_logradouro, nome_logradouro)),
              '\\s+',
              ' ',
              'g'
            ) as logradouro,
            count(*) as registros
          from {base}
          where {where_ms}
          group by cep, logradouro
        ),
        ranked as (
          select
            cep,
            logradouro,
            registros,
            row_number() over (partition by cep order by registros desc, logradouro) as rn
          from counts
          where logradouro is not null and logradouro <> ''
        )
        select cep, logradouro, registros
        from ranked
        where rn = 1
        """
    ).fetchall()

    localidades_by_cep: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for cep, localidade, registros in localidade_rows:
        if not cep or not localidade:
            continue
        localidades_by_cep[str(cep)].append(
            {
                "bairro": str(localidade).strip(),
                "registros": int(registros),
            }
        )

    top_logradouro_by_cep = {
        str(cep): (str(logradouro).strip(), int(registros))
        for cep, logradouro, registros in logradouro_rows
        if cep and logradouro
    }

    now = datetime.now(timezone.utc)
    values: list[tuple[Any, ...]] = []

    for (
        cep,
        uf,
        ibge_municipio_id,
        cidade,
        total_registros,
        localidades_count,
        logradouros_count,
        latitude,
        longitude,
    ) in main_rows:
        cep_str = str(cep)
        total = int(total_registros)
        localidades = localidades_by_cep.get(cep_str, [])

        top_bairro = localidades[0]["bairro"] if localidades else None
        top_bairro_registros = int(localidades[0]["registros"]) if localidades else 0
        bairro_confianca = (top_bairro_registros / total) if total else None

        localidades_payload = []
        for item in localidades[:TOP_LOCALIDADES]:
            registros = int(item["registros"])
            localidades_payload.append(
                {
                    "bairro": item["bairro"],
                    "registros": registros,
                    "proporcao": round(registros / total, 6) if total else 0,
                }
            )

        top_logradouro = top_logradouro_by_cep.get(cep_str)
        logradouro = None
        if top_logradouro:
            nome_logradouro, registros_logradouro = top_logradouro
            logradouro_share = registros_logradouro / total if total else 0
            if int(logradouros_count) == 1 or logradouro_share >= 0.8:
                logradouro = nome_logradouro

        values.append(
            (
                cep_str,
                str(uf or "MS"),
                str(cidade or "").strip(),
                top_bairro,
                logradouro,
                ORIGEM,
                str(ibge_municipio_id or "").strip() or None,
                Json(localidades_payload),
                bairro_confianca,
                total,
                int(localidades_count),
                int(logradouros_count),
                as_float(latitude),
                as_float(longitude),
                now,
                now,
                now,
            )
        )

    return values


def upsert_values(database_url: str, values: list[tuple[Any, ...]]) -> None:
    sql = """
    INSERT INTO ceps_ms (
      cep,
      uf,
      cidade,
      bairro,
      logradouro,
      origem,
      ibge_municipio_id,
      localidades,
      bairro_confianca,
      total_registros,
      localidades_count,
      logradouros_count,
      latitude,
      longitude,
      importado_em,
      criado_em,
      atualizado_em
    )
    VALUES %s
    ON CONFLICT (cep) DO UPDATE SET
      uf = EXCLUDED.uf,
      cidade = EXCLUDED.cidade,
      bairro = EXCLUDED.bairro,
      logradouro = EXCLUDED.logradouro,
      origem = EXCLUDED.origem,
      ibge_municipio_id = EXCLUDED.ibge_municipio_id,
      localidades = EXCLUDED.localidades,
      bairro_confianca = EXCLUDED.bairro_confianca,
      total_registros = EXCLUDED.total_registros,
      localidades_count = EXCLUDED.localidades_count,
      logradouros_count = EXCLUDED.logradouros_count,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      importado_em = EXCLUDED.importado_em,
      atualizado_em = EXCLUDED.atualizado_em
    """

    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cur:
            for index in range(0, len(values), BATCH_SIZE):
                batch = values[index:index + BATCH_SIZE]
                execute_values(cur, sql, batch, page_size=len(batch))
                print(f"upsert {min(index + len(batch), len(values))}/{len(values)}")


def main() -> int:
    load_env()
    parser = build_parser()
    args = parser.parse_args()

    parquet_arg = args.parquet or os.getenv("IBGE_CEPS_MS_PARQUET_PATH")
    if not parquet_arg:
        print("Informe o caminho do Parquet ou configure IBGE_CEPS_MS_PARQUET_PATH.", file=sys.stderr)
        return 2

    parquet_path = Path(parquet_arg)
    if not parquet_path.exists():
        print(f"Arquivo nao encontrado: {parquet_path}", file=sys.stderr)
        return 2

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL nao configurada.", file=sys.stderr)
        return 2

    values = fetch_aggregates(parquet_path)
    if not values:
        print("Nenhum CEP valido de MS encontrado no Parquet.", file=sys.stderr)
        return 1

    total = len(values)
    ambiguous = sum(1 for item in values if item[10] > 1)
    low_confidence = sum(1 for item in values if item[8] is not None and item[8] < 0.8)

    print(f"CEPs agregados: {total}")
    print(f"CEPs com mais de uma localidade: {ambiguous}")
    print(f"CEPs com localidade principal abaixo de 80%: {low_confidence}")

    if args.dry_run:
        print("Dry-run concluido. Nenhum dado foi gravado.")
        return 0

    upsert_values(database_url, values)
    print("Importacao concluida.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
