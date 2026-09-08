/**
 * Testes da sequencia da licao. Rodam sem banco e sem rede:
 *   npm test
 *
 * O fixture reproduz a forma gravada em 0005_listening.sql e 0014_unit2_content.sql:
 * um bloco de abertura, tres blocos LISTENING seguidos e um unico bloco EXERCISE
 * no fim, com as perguntas amarradas as faixas por media_id.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildLessonSteps } from "./lesson-flow.ts";
import type { StudentExercise } from "./exercises/types.ts";
import type { LessonBlock, LessonDetail, StudentMedia } from "./queries.ts";

function media(id: number): StudentMedia {
  return { id, kind: "audio", title: `Track ${id}`, url: `https://x/${id}.wav?token=a`, durationSeconds: 10 };
}

function exercise(id: number, mediaId: number | null = null): StudentExercise {
  return {
    id,
    type: "MULTIPLE_CHOICE",
    instruction: null,
    question: `Q${id}`,
    difficulty: 1,
    xpReward: 10,
    position: id,
    prompt: {},
    mediaId,
    options: [],
  };
}

function block(
  id: number,
  type: string,
  extra: Partial<LessonBlock> = {},
): LessonBlock {
  return {
    id,
    type,
    title: `B${id}`,
    content: {},
    mediaId: null,
    position: id,
    exercises: [],
    ...extra,
  };
}

function lesson(blocks: LessonBlock[], medias: StudentMedia[] = []): LessonDetail {
  return {
    id: 1,
    title: "Licao",
    description: null,
    objective: null,
    estimatedMinutes: 10,
    xpReward: 50,
    position: 1,
    moduleTitle: "Unit",
    blocks,
    media: Object.fromEntries(medias.map((m) => [m.id, m])),
    totalExercises: blocks.reduce((n, b) => n + b.exercises.length, 0),
  };
}

/** Rotulo curto de cada etapa, para a asercao ler como a tela que o aluno ve. */
function trace(detail: LessonDetail): string[] {
  return buildLessonSteps(detail).map((s) =>
    s.kind === "study" ? `bloco ${s.block.id}` : `pergunta ${s.exercise.id}`,
  );
}

describe("buildLessonSteps", () => {
  it("intercala cada faixa com as perguntas dela", () => {
    const [m1, m2] = [media(1), media(2)];
    const detail = lesson(
      [
        block(1, "CONTENT", { content: { paragraphs: ["Antes de ouvir"] } }),
        block(2, "LISTENING", { mediaId: m1.id }),
        block(3, "LISTENING", { mediaId: m2.id }),
        block(4, "EXERCISE", {
          exercises: [exercise(10, m1.id), exercise(11, m1.id), exercise(12, m2.id)],
        }),
      ],
      [m1, m2],
    );

    assert.deepEqual(trace(detail), [
      "bloco 1",
      "bloco 2",
      "pergunta 10",
      "pergunta 11",
      "bloco 3",
      "pergunta 12",
    ]);
  });

  it("marca a ultima pergunta de cada faixa, que e onde a transcricao abre", () => {
    const m1 = media(1);
    const detail = lesson(
      [
        block(1, "LISTENING", { mediaId: m1.id }),
        block(2, "EXERCISE", { exercises: [exercise(10, m1.id), exercise(11, m1.id)] }),
      ],
      [m1],
    );

    const ends = buildLessonSteps(detail).map((s) => s.kind === "exercise" && s.endsTrack);
    assert.deepEqual(ends, [false, false, true]);
  });

  it("conta as perguntas que vem logo depois do bloco", () => {
    const m1 = media(1);
    const detail = lesson(
      [
        block(1, "LISTENING", { mediaId: m1.id }),
        block(2, "EXERCISE", { exercises: [exercise(10, m1.id), exercise(11, m1.id)] }),
      ],
      [m1],
    );

    const [first] = buildLessonSteps(detail);
    assert.equal(first.kind === "study" && first.questionCount, 2);
  });

  it("mantem a ordem do livro quando nao ha listening", () => {
    const detail = lesson([
      block(1, "CONTENT", { content: { paragraphs: ["p"] } }),
      block(2, "VOCABULARY", { content: { items: [{ word: "a", translation: "b" }] } }),
      block(3, "EXERCISE", { exercises: [exercise(10), exercise(11)] }),
    ]);

    assert.deepEqual(trace(detail), ["bloco 1", "bloco 2", "pergunta 10", "pergunta 11"]);
  });

  it("pula bloco sem nada para mostrar, para nao virar tela em branco", () => {
    const detail = lesson([
      block(1, "CONTENT"),
      block(2, "VOCABULARY", { content: { items: [] } }),
      block(3, "EXERCISE", { exercises: [exercise(10)] }),
    ]);

    assert.deepEqual(trace(detail), ["pergunta 10"]);
  });

  it("deixa a pergunta com audio avulso no lugar dela", () => {
    const m9 = media(9); // midia sem bloco LISTENING proprio
    const detail = lesson(
      [
        block(1, "CONTENT", { content: { paragraphs: ["p"] } }),
        block(2, "EXERCISE", { exercises: [exercise(10, m9.id)] }),
      ],
      [m9],
    );

    const steps = buildLessonSteps(detail);
    assert.deepEqual(trace(detail), ["bloco 1", "pergunta 10"]);
    assert.equal(steps[1].kind === "exercise" && steps[1].media?.id, m9.id);
    assert.equal(steps[1].kind === "exercise" && steps[1].endsTrack, false);
  });

  it("nao perde pergunta de bloco de tipo desconhecido", () => {
    const detail = lesson([block(1, "SOMETHING_NEW", { exercises: [exercise(10)] })]);
    assert.deepEqual(trace(detail), ["pergunta 10"]);
  });

  it("emite cada pergunta uma unica vez", () => {
    const m1 = media(1);
    const detail = lesson(
      [
        block(1, "LISTENING", { mediaId: m1.id, exercises: [exercise(10, m1.id)] }),
        block(2, "EXERCISE", { exercises: [exercise(11, m1.id)] }),
      ],
      [m1],
    );

    assert.deepEqual(trace(detail), ["bloco 1", "pergunta 10", "pergunta 11"]);
  });
});
