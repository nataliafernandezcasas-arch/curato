-- 033 · Qué fotografía cada storyteller
--
-- Decisión de Natalia (2026-09-11): la lista de la pantalla 16b sustituye a la
-- pregunta "Quel type de contenu créez-vous ?" del cuestionario de bienvenida.
-- La vieja hablaba de temas (Food, Lifestyle, Travel…); la nueva dice cómo
-- mira una persona, y es lo que la casa lee en su dossier. Dos al más.
--
-- Se guarda donde siempre: survey_questions (slug content_type) y
-- creator_survey_responses. Nada más lee estas respuestas: las etiquetas de
-- emparejamiento de la migración 009 nunca se sembraron.
--
-- Revisar antes de aplicar: cómo se traducen las respuestas que ya existen.
--
--   food             → tables      (Tables et cuisines)
--   hotel_reviews    → interieurs  (Intérieurs et matières)
--   fashion_adjacent → portraits   (Portraits et gestes)
--   wellness         → soins       (Soins et bien-être)
--   lifestyle        → nada
--   travel           → nada
--
-- Lifestyle y Travel no caben en ninguna de las cuatro sin inventar, así que
-- se pierden. A quien le quede alguna categoría se le conservan todas las que
-- tenía, aunque sean más de dos: el tope se aplica cuando vuelva a elegir, en
-- la 16b o en el cuestionario, porque recortar ahora sería decidir por la
-- persona cuáles dos la describen. A quien no le quede ninguna se le borra la
-- respuesta, para que la 16b le pida elegir.

-- 1 · La pregunta, con las cuatro opciones nuevas.
UPDATE survey_questions
SET question_text_fr = 'Que photographiez-vous ?',
    question_text_es = '¿Qué fotografías?',
    question_text_en = 'What do you photograph?',
    question_type    = 'multi_select',
    options = $json$[
      {"value":"tables","label_fr":"Tables et cuisines","label_es":"Mesas y cocinas","label_en":"Tables and kitchens"},
      {"value":"interieurs","label_fr":"Intérieurs et matières","label_es":"Interiores y materias","label_en":"Interiors and materials"},
      {"value":"portraits","label_fr":"Portraits et gestes","label_es":"Retratos y gestos","label_en":"Portraits and gestures"},
      {"value":"soins","label_fr":"Soins et bien-être","label_es":"Cuidados y bienestar","label_en":"Care and wellness"}
    ]$json$::jsonb,
    updated_at = now()
WHERE slug = 'content_type';

-- 2 · Las respuestas que ya existen, traducidas. Incluye las nuevas como
-- traducción de sí mismas, para que aplicar esto dos veces no rompa nada.
WITH mapa (viejo, nuevo, orden) AS (
  VALUES
    ('food', 'tables', 1), ('tables', 'tables', 1),
    ('hotel_reviews', 'interieurs', 2), ('interieurs', 'interieurs', 2),
    ('fashion_adjacent', 'portraits', 3), ('portraits', 'portraits', 3),
    ('wellness', 'soins', 4), ('soins', 'soins', 4)
),
traducidas AS (
  SELECT r.id, jsonb_agg(t.nuevo ORDER BY t.orden) AS answer
  FROM creator_survey_responses r
  CROSS JOIN LATERAL (
    SELECT DISTINCT m.nuevo, m.orden
    FROM jsonb_array_elements_text(r.answer) AS v(valor)
    JOIN mapa m ON m.viejo = v.valor
  ) t
  WHERE r.question_slug = 'content_type'
  GROUP BY r.id
)
UPDATE creator_survey_responses r
SET answer = t.answer
FROM traducidas t
WHERE r.id = t.id;

-- 3 · A quien no le quedó ninguna, se le borra para que vuelva a elegir.
DELETE FROM creator_survey_responses
WHERE question_slug = 'content_type'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(answer) AS v(valor)
    WHERE v.valor IN ('tables', 'interieurs', 'portraits', 'soins')
  );
