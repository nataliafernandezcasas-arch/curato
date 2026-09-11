import { describe, expect, it } from "vitest";
import { isSubject, subjectLabel, SUBJECT_MAX, SUBJECTS } from "./photo-subjects";

describe("qué fotografía cada storyteller", () => {
  it("son cuatro, y dos al más", () => {
    expect(SUBJECTS.map((s) => s.slug)).toEqual(["tables", "interieurs", "portraits", "soins"]);
    expect(SUBJECT_MAX).toBe(2);
  });

  it("cada una tiene su etiqueta en los tres idiomas", () => {
    expect(subjectLabel("tables")).toBe("Tables et cuisines");
    expect(subjectLabel("tables", "en")).toBe("Tables and kitchens");
    expect(subjectLabel("soins", "es")).toBe("Cuidados y bienestar");
  });

  it("una respuesta de antes de la 033 se sigue leyendo", () => {
    expect(subjectLabel("travel")).toBe("Voyage");
    expect(subjectLabel("algo-raro")).toBe("algo-raro");
  });

  it("solo las cuatro son válidas", () => {
    expect(isSubject("portraits")).toBe(true);
    expect(isSubject("food")).toBe(false);
    expect(isSubject(3)).toBe(false);
  });
});
