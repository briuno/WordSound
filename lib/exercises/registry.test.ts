/**
 * Testes do exercise engine. Rodam sem banco e sem rede:
 *   npm test
 *
 * Os fixtures reproduzem exatamente as formas gravadas em 0004_seed.sql.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EXERCISE_REGISTRY, gradeAnswer, normalizeText } from "./registry.ts";
import { EXERCISE_TYPES, type ExerciseOption } from "./types.ts";

const noOptions: ExerciseOption[] = [];
const empty = {};

function opts(...pairs: [string, boolean][]): ExerciseOption[] {
  return pairs.map(([text, isCorrect], i) => ({ id: i + 1, text, isCorrect, position: i + 1 }));
}

describe("normalizeText", () => {
  it("remove acento, pontuacao final e espaco extra", () => {
    assert.equal(normalizeText("  Olá,  Mundo!  "), "ola, mundo");
    assert.equal(normalizeText("ARE"), "are");
  });

  it("devolve string vazia para nao-texto", () => {
    assert.equal(normalizeText(null), "");
    assert.equal(normalizeText(42), "");
  });
});

describe("registry", () => {
  it("cobre todos os tipos declarados", () => {
    for (const type of EXERCISE_TYPES) {
      assert.ok(EXERCISE_REGISTRY[type], `faltou definicao para ${type}`);
      assert.equal(EXERCISE_REGISTRY[type].type, type);
    }
  });

  it("tipo desconhecido nunca vira acerto", () => {
    const r = gradeAnswer("NAO_EXISTE", { answer: { value: true }, answerKey: empty, options: noOptions, prompt: empty });
    assert.equal(r.isCorrect, false);
  });
});

describe("MULTIPLE_CHOICE", () => {
  const options = opts(["Can you repeat, please?", true], ["Close the door, please.", false]);
  const base = { answerKey: empty, options, prompt: empty };

  it("acerta a opcao correta", () => {
    const r = gradeAnswer("MULTIPLE_CHOICE", { ...base, answer: { optionId: 1 } });
    assert.equal(r.isCorrect, true);
    assert.equal(r.correctAnswer, "Can you repeat, please?");
  });

  it("erra a opcao errada e ainda revela o gabarito", () => {
    const r = gradeAnswer("MULTIPLE_CHOICE", { ...base, answer: { optionId: 2 } });
    assert.equal(r.isCorrect, false);
    assert.equal(r.correctAnswer, "Can you repeat, please?");
  });

  it("resposta malformada nao passa", () => {
    const r = gradeAnswer("MULTIPLE_CHOICE", { ...base, answer: { optionId: "1" } });
    assert.equal(r.isCorrect, false);
  });
});

describe("TRUE_FALSE", () => {
  const base = { answerKey: { value: false }, options: noOptions, prompt: empty };

  it("aceita o booleano correto", () => {
    assert.equal(gradeAnswer("TRUE_FALSE", { ...base, answer: { value: false } }).isCorrect, true);
  });

  it("rejeita o booleano errado", () => {
    assert.equal(gradeAnswer("TRUE_FALSE", { ...base, answer: { value: true } }).isCorrect, false);
  });

  it("rejeita string no lugar de booleano", () => {
    assert.equal(gradeAnswer("TRUE_FALSE", { ...base, answer: { value: "false" } }).isCorrect, false);
  });
});

describe("FILL_BLANK", () => {
  const base = {
    answerKey: { blanks: [{ accepted: ["are"] }] },
    options: noOptions,
    prompt: { template: "My friends {{0}} students." },
  };

  it("aceita ignorando caixa e espaco", () => {
    assert.equal(gradeAnswer("FILL_BLANK", { ...base, answer: { values: ["  ARE "] } }).isCorrect, true);
  });

  it("rejeita palavra errada", () => {
    assert.equal(gradeAnswer("FILL_BLANK", { ...base, answer: { values: ["is"] } }).isCorrect, false);
  });

  it("exige uma resposta por lacuna", () => {
    const two = { ...base, answerKey: { blanks: [{ accepted: ["am"] }, { accepted: ["are"] }] } };
    assert.equal(gradeAnswer("FILL_BLANK", { ...two, answer: { values: ["am"] } }).isCorrect, false);
    assert.equal(gradeAnswer("FILL_BLANK", { ...two, answer: { values: ["am", "are"] } }).isCorrect, true);
  });
});

describe("SHORT_ANSWER", () => {
  const base = {
    answerKey: { accepted: ["nice to meet you too", "you too"] },
    options: noOptions,
    prompt: empty,
  };

  it("aceita qualquer variante da lista", () => {
    assert.equal(gradeAnswer("SHORT_ANSWER", { ...base, answer: { value: "You too!" } }).isCorrect, true);
    assert.equal(
      gradeAnswer("SHORT_ANSWER", { ...base, answer: { value: "Nice to meet you too." } }).isCorrect,
      true,
    );
  });

  it("rejeita resposta fora da lista", () => {
    assert.equal(gradeAnswer("SHORT_ANSWER", { ...base, answer: { value: "goodbye" } }).isCorrect, false);
  });

  it("rejeita vazio", () => {
    assert.equal(gradeAnswer("SHORT_ANSWER", { ...base, answer: { value: "   " } }).isCorrect, false);
  });
});

describe("ORDER_WORDS", () => {
  const base = {
    answerKey: { order: ["My", "name", "is", "Ana"] },
    options: noOptions,
    prompt: { tokens: ["is", "My", "Ana", "name"] },
  };

  it("aceita a ordem correta", () => {
    const r = gradeAnswer("ORDER_WORDS", { ...base, answer: { order: ["My", "name", "is", "Ana"] } });
    assert.equal(r.isCorrect, true);
    assert.equal(r.correctAnswer, "My name is Ana");
  });

  it("rejeita ordem trocada", () => {
    assert.equal(
      gradeAnswer("ORDER_WORDS", { ...base, answer: { order: ["My", "is", "name", "Ana"] } }).isCorrect,
      false,
    );
  });

  it("rejeita quantidade diferente", () => {
    assert.equal(gradeAnswer("ORDER_WORDS", { ...base, answer: { order: ["My", "name"] } }).isCorrect, false);
  });
});

describe("MATCHING", () => {
  const base = {
    answerKey: { pairs: [[0, 1], [1, 3], [2, 2], [3, 0]] },
    options: noOptions,
    prompt: {
      left: ["teacher", "homework", "question", "listen"],
      right: ["ouvir", "professor", "pergunta", "dever de casa"],
    },
  };

  it("aceita os pares corretos em qualquer ordem", () => {
    const r = gradeAnswer("MATCHING", { ...base, answer: { pairs: [[3, 0], [2, 2], [1, 3], [0, 1]] } });
    assert.equal(r.isCorrect, true);
  });

  it("rejeita um par trocado", () => {
    const r = gradeAnswer("MATCHING", { ...base, answer: { pairs: [[0, 0], [1, 3], [2, 2], [3, 1]] } });
    assert.equal(r.isCorrect, false);
  });

  it("descreve o gabarito de forma legivel", () => {
    const r = gradeAnswer("MATCHING", { ...base, answer: { pairs: [] } });
    assert.match(r.correctAnswer, /teacher → professor/);
  });
});
