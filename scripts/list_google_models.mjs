/**
 * Lista os modelos do Gemini que a chave do .env realmente alcanca.
 *
 *   npm run ai:models
 *
 * Serve para escolher o valor de GOOGLE_MODEL sem chutar: a lista de modelos
 * muda com frequencia e varia por chave e por regiao.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(import.meta.dirname);

function envVar(name) {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^"'\\n]+)`, "m"));
  const value = match?.[1]?.trim();
  if (!value || /^COLE_/i.test(value) || value.includes("_AQUI")) return null;
  return value;
}

const key = envVar("GOOGLE_API_KEY") ?? envVar("GEMINI_API_KEY");
if (!key) {
  console.error("GOOGLE_API_KEY nao configurada no .env.");
  console.error("Pegue uma chave em https://aistudio.google.com/apikey e cole no .env.");
  process.exit(1);
}

const { GoogleGenAI } = await import("@google/genai");
const ai = new GoogleGenAI({ apiKey: key });

try {
  const page = await ai.models.list();
  const rows = [];
  for await (const model of page) {
    const actions = model.supportedActions ?? [];
    if (actions.length && !actions.includes("generateContent")) continue;
    rows.push({
      id: (model.name ?? "").replace(/^models\//, ""),
      label: model.displayName ?? "",
      input: model.inputTokenLimit ?? "",
      output: model.outputTokenLimit ?? "",
    });
  }

  if (rows.length === 0) {
    console.log("Nenhum modelo com generateContent disponivel para esta chave.");
    process.exit(0);
  }

  rows.sort((a, b) => a.id.localeCompare(b.id));
  console.log(`${rows.length} modelo(s) disponiveis para generateContent:\n`);
  console.log("  " + "MODEL ID".padEnd(38) + "IN".padStart(9) + "OUT".padStart(9) + "  NOME");
  for (const r of rows) {
    console.log(
      "  " +
        r.id.padEnd(38) +
        String(r.input).padStart(9) +
        String(r.output).padStart(9) +
        "  " +
        r.label,
    );
  }
  console.log("\nDefina o escolhido em GOOGLE_MODEL no .env.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Falha ao listar modelos:", message.slice(0, 300));
  process.exit(1);
}
