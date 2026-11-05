// Leitura dos CSVs de candidaturas do TSE (latin1, ';', campos entre aspas).
import { readFileSync } from "node:fs";

export function lerCsvTse(path) {
  const texto = new TextDecoder("latin1").decode(readFileSync(path));
  const linhas = texto.split(/\r?\n/).filter(Boolean);
  const parse = (l) => {
    const out = [];
    let cur = "",
      q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (q) {
        if (c === '"' && l[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ";") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = parse(linhas[0]);
  return linhas.slice(1).map((l) => {
    const v = parse(l);
    return Object.fromEntries(header.map((h, i) => [h, v[i]]));
  });
}

/** Valores "#NULO", "#NE" e vazios do TSE viram null. */
export const limpo = (v) =>
  v == null || v === "" || v.startsWith("#") ? null : v.trim();
