-- ============================================================================
-- 010_creator_onboarding_surveys.sql
-- Curato Collective — Creator onboarding survey
-- ============================================================================
-- Captures into version control the survey infrastructure that was applied
-- ad-hoc to Supabase Studio. Everything in this file is idempotent and safe
-- to re-run against an existing database.
--
-- New on top of what's already in production:
--   * UNIQUE (creator_id, question_slug) on creator_survey_responses so that
--     a creator who re-submits the quiz overwrites instead of duplicating.
--   * UNIQUE constraints on survey_questions.slug and venue_tags
--     (namespace, slug) to make ON CONFLICT upserts safe.
--   * creators.onboarding_survey_completed_at — flag used by /dashboard
--     routing to redirect first-time creators to /onboarding/survey.
--   * updated_at trigger on survey_questions.
--
-- Does NOT seed venue_tags — that's a separate task that the matching
-- algorithm depends on. Run that as 011 once the tag taxonomy is decided.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. survey_questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_questions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  position          INTEGER     NOT NULL,
  slug              TEXT        NOT NULL,
  question_text_es  TEXT        NOT NULL,
  question_text_fr  TEXT,
  question_text_en  TEXT,
  question_type     TEXT        NOT NULL
                                CHECK (question_type IN ('multi_select', 'cards', 'single_select', 'slider')),
  options           JSONB       NOT NULL,
  is_required       BOOLEAN     NOT NULL DEFAULT true,
  active            BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE survey_questions
    ADD CONSTRAINT survey_questions_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS survey_questions_position_idx
  ON survey_questions (position) WHERE active = true;

DROP TRIGGER IF EXISTS trg_survey_questions_updated_at ON survey_questions;
CREATE TRIGGER trg_survey_questions_updated_at
  BEFORE UPDATE ON survey_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ----------------------------------------------------------------------------
-- 2. creator_survey_responses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_survey_responses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID        NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  question_slug TEXT        NOT NULL,
  answer        JSONB       NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE creator_survey_responses
    ADD CONSTRAINT creator_survey_responses_creator_question_unique
    UNIQUE (creator_id, question_slug);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS creator_survey_responses_creator_idx
  ON creator_survey_responses (creator_id);


-- ----------------------------------------------------------------------------
-- 3. venue_tags (taxonomy used by the matching algorithm)
-- ----------------------------------------------------------------------------
-- namespace = question slug (e.g. 'cuisines_love'), slug = option value
-- (e.g. 'italiana'). Letting venues carry a list of tag slugs lets the
-- matching algo do simple set-intersection with creator responses.
CREATE TABLE IF NOT EXISTS venue_tags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace   TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  label_es    TEXT        NOT NULL,
  label_fr    TEXT,
  label_en    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE venue_tags
    ADD CONSTRAINT venue_tags_namespace_slug_unique UNIQUE (namespace, slug);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS venue_tags_namespace_idx ON venue_tags (namespace);


-- ----------------------------------------------------------------------------
-- 4. creators.onboarding_survey_completed_at
-- ----------------------------------------------------------------------------
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS onboarding_survey_completed_at TIMESTAMPTZ;

-- Partial index: lookups will be "needs to fill the survey?" → IS NULL.
CREATE INDEX IF NOT EXISTS creators_survey_pending_idx
  ON creators (onboarding_survey_completed_at)
  WHERE onboarding_survey_completed_at IS NULL;


-- ----------------------------------------------------------------------------
-- 5. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE survey_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_tags               ENABLE ROW LEVEL SECURITY;

-- ── survey_questions: public reads active rows, admin manages all
DROP POLICY IF EXISTS "survey_questions read"  ON survey_questions;
DROP POLICY IF EXISTS "survey_questions admin" ON survey_questions;
CREATE POLICY "survey_questions read"
  ON survey_questions FOR SELECT
  USING (active = true OR public.is_admin());
CREATE POLICY "survey_questions admin"
  ON survey_questions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── creator_survey_responses: creator owns their rows; admin owns all
DROP POLICY IF EXISTS "survey_responses creator read"  ON creator_survey_responses;
DROP POLICY IF EXISTS "survey_responses creator write" ON creator_survey_responses;
DROP POLICY IF EXISTS "survey_responses admin"         ON creator_survey_responses;
CREATE POLICY "survey_responses creator read"
  ON creator_survey_responses FOR SELECT
  USING (
    public.is_admin()
    OR creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid())
  );
CREATE POLICY "survey_responses creator write"
  ON creator_survey_responses FOR ALL
  USING       (creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid()))
  WITH CHECK  (creator_id IN (SELECT id FROM creators WHERE owner_id = auth.uid()));
CREATE POLICY "survey_responses admin"
  ON creator_survey_responses FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── venue_tags: public catalogue (read), admin writes
DROP POLICY IF EXISTS "venue_tags read"  ON venue_tags;
DROP POLICY IF EXISTS "venue_tags admin" ON venue_tags;
CREATE POLICY "venue_tags read"
  ON venue_tags FOR SELECT
  USING (true);
CREATE POLICY "venue_tags admin"
  ON venue_tags FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 6. Seed — 10 onboarding survey questions
-- ----------------------------------------------------------------------------
-- Edit question wording HERE, not in Studio. Re-applying this migration will
-- overwrite the production rows with whatever's below (ON CONFLICT DO UPDATE).
-- Existing UUIDs are preserved because PK is excluded from the conflict update.

INSERT INTO survey_questions (position, slug, question_text_es, question_text_fr, question_text_en, question_type, options) VALUES
(1, 'cuisines_love',
 '¿Qué cocinas te enamoran?',
 'Quelles cuisines vous font vibrer ?',
 'Which cuisines do you love?',
 'multi_select',
 '[{"value":"italiana","label_es":"Italiana","label_fr":"Italienne","label_en":"Italian"},{"value":"japonesa","label_es":"Japonesa","label_fr":"Japonaise","label_en":"Japanese"},{"value":"francesa","label_es":"Francesa","label_fr":"Française","label_en":"French"},{"value":"mediterranea","label_es":"Mediterránea","label_fr":"Méditerranéenne","label_en":"Mediterranean"},{"value":"healthy","label_es":"Healthy","label_fr":"Healthy","label_en":"Healthy"},{"value":"fusion","label_es":"Fusión","label_fr":"Fusion","label_en":"Fusion"},{"value":"latina","label_es":"Latina","label_fr":"Latine","label_en":"Latin"},{"value":"asiatica","label_es":"Asiática","label_fr":"Asiatique","label_en":"Asian"},{"value":"vegana","label_es":"Vegana","label_fr":"Végane","label_en":"Vegan"}]'::jsonb),
(2, 'drink_preference',
 '¿Qué tomas?',
 'Que buvez-vous ?',
 'What do you drink?',
 'multi_select',
 '[{"value":"cocktails","label_es":"Cocktails","label_fr":"Cocktails","label_en":"Cocktails"},{"value":"vino_natural","label_es":"Vino natural","label_fr":"Vin nature","label_en":"Natural wine"},{"value":"champagne","label_es":"Champagne","label_fr":"Champagne","label_en":"Champagne"},{"value":"sin_alcohol","label_es":"Sin alcohol","label_fr":"Sans alcool","label_en":"Alcohol-free"},{"value":"mezcal_tequila","label_es":"Mezcal / Tequila","label_fr":"Mezcal / Tequila","label_en":"Mezcal / Tequila"},{"value":"sake","label_es":"Sake","label_fr":"Saké","label_en":"Sake"}]'::jsonb),
(3, 'hotel_vibe',
 '¿Qué vibe de hotel te llama?',
 'Quelle ambiance d''hôtel vous parle ?',
 'Which hotel vibe calls you?',
 'cards',
 '[{"value":"boutique_chic","label_es":"Boutique chic","label_fr":"Boutique chic","label_en":"Boutique chic"},{"value":"palacio_clasico","label_es":"Palacio clásico","label_fr":"Palace classique","label_en":"Classic palace"},{"value":"design_moderno","label_es":"Design moderno","label_fr":"Design moderne","label_en":"Modern design"},{"value":"romantico_bohemio","label_es":"Romántico bohemio","label_fr":"Romantique bohème","label_en":"Bohemian romantic"},{"value":"minimalista_zen","label_es":"Minimalista zen","label_fr":"Minimaliste zen","label_en":"Minimalist zen"}]'::jsonb),
(4, 'wellness_practices',
 '¿Qué prácticas de wellness te mueven?',
 'Quelles pratiques bien-être vous animent ?',
 'Which wellness practices move you?',
 'multi_select',
 '[{"value":"yoga","label_es":"Yoga","label_fr":"Yoga","label_en":"Yoga"},{"value":"pilates","label_es":"Pilates","label_fr":"Pilates","label_en":"Pilates"},{"value":"breathwork","label_es":"Breathwork","label_fr":"Breathwork","label_en":"Breathwork"},{"value":"meditacion","label_es":"Meditación","label_fr":"Méditation","label_en":"Meditation"},{"value":"sauna","label_es":"Sauna","label_fr":"Sauna","label_en":"Sauna"},{"value":"bano_helado","label_es":"Baño helado","label_fr":"Bain froid","label_en":"Ice bath"},{"value":"watsu","label_es":"Watsu","label_fr":"Watsu","label_en":"Watsu"}]'::jsonb),
(5, 'beauty_rituals',
 '¿Qué rituales de belleza son tu sello?',
 'Quels rituels beauté vous définissent ?',
 'Which beauty rituals are your signature?',
 'multi_select',
 '[{"value":"peluqueria_autor","label_es":"Peluquería de autor","label_fr":"Coiffeur de référence","label_en":"Signature salon"},{"value":"manicure","label_es":"Manicure","label_fr":"Manucure","label_en":"Manicure"},{"value":"faciales","label_es":"Faciales","label_fr":"Soins du visage","label_en":"Facials"},{"value":"masajes","label_es":"Masajes","label_fr":"Massages","label_en":"Massages"},{"value":"makeup_artist","label_es":"Maquillaje pro","label_fr":"Maquilleur pro","label_en":"Makeup artist"}]'::jsonb),
(6, 'dietary_preferences',
 '¿Tienes preferencias alimentarias?',
 'Avez-vous des préférences alimentaires ?',
 'Any dietary preferences?',
 'multi_select',
 '[{"value":"vegano","label_es":"Vegano","label_fr":"Végan","label_en":"Vegan"},{"value":"vegetariano","label_es":"Vegetariano","label_fr":"Végétarien","label_en":"Vegetarian"},{"value":"sin_gluten","label_es":"Sin gluten","label_fr":"Sans gluten","label_en":"Gluten-free"},{"value":"sin_alcohol","label_es":"Sin alcohol","label_fr":"Sans alcool","label_en":"Alcohol-free"},{"value":"halal","label_es":"Halal","label_fr":"Halal","label_en":"Halal"},{"value":"kosher","label_es":"Kosher","label_fr":"Kasher","label_en":"Kosher"},{"value":"ninguna","label_es":"Ninguna","label_fr":"Aucune","label_en":"None"}]'::jsonb),
(7, 'aesthetic_personal',
 '¿Cuál es tu estética personal?',
 'Quelle est votre esthétique personnelle ?',
 'What is your personal aesthetic?',
 'cards',
 '[{"value":"parisian_classic","label_es":"Parisian classic","label_fr":"Parisian classic","label_en":"Parisian classic"},{"value":"minimalista_nordico","label_es":"Minimalista nórdico","label_fr":"Minimaliste nordique","label_en":"Nordic minimalist"},{"value":"maximalist_eclectic","label_es":"Maximalista ecléctico","label_fr":"Maximaliste éclectique","label_en":"Maximalist eclectic"},{"value":"y2k","label_es":"Y2K","label_fr":"Y2K","label_en":"Y2K"},{"value":"dark_academia","label_es":"Dark academia","label_fr":"Dark academia","label_en":"Dark academia"}]'::jsonb),
(8, 'arrondissements_love',
 '¿Qué arrondissements amas?',
 'Quels arrondissements aimez-vous ?',
 'Which arrondissements do you love?',
 'multi_select',
 '[{"value":"1er","label_es":"1er","label_fr":"1er","label_en":"1st"},{"value":"4e","label_es":"4e (Le Marais)","label_fr":"4e (Le Marais)","label_en":"4th (Le Marais)"},{"value":"6e","label_es":"6e (Saint-Germain)","label_fr":"6e (Saint-Germain)","label_en":"6th (Saint-Germain)"},{"value":"8e","label_es":"8e","label_fr":"8e","label_en":"8th"},{"value":"9e","label_es":"9e","label_fr":"9e","label_en":"9th"},{"value":"11e","label_es":"11e","label_fr":"11e","label_en":"11th"},{"value":"16e","label_es":"16e","label_fr":"16e","label_en":"16th"},{"value":"18e","label_es":"18e (Montmartre)","label_fr":"18e (Montmartre)","label_en":"18th (Montmartre)"},{"value":"explorar_todos","label_es":"Explorar todos","label_fr":"Explorer tous","label_en":"Explore all"}]'::jsonb),
(9, 'content_type',
 '¿Qué tipo de contenido haces?',
 'Quel type de contenu créez-vous ?',
 'What content do you create?',
 'multi_select',
 '[{"value":"food","label_es":"Food","label_fr":"Food","label_en":"Food"},{"value":"hotel_reviews","label_es":"Hotel reviews","label_fr":"Avis d''hôtel","label_en":"Hotel reviews"},{"value":"wellness","label_es":"Wellness","label_fr":"Bien-être","label_en":"Wellness"},{"value":"fashion_adjacent","label_es":"Fashion-adjacent","label_fr":"Mode et lifestyle","label_en":"Fashion-adjacent"},{"value":"lifestyle","label_es":"Lifestyle","label_fr":"Lifestyle","label_en":"Lifestyle"},{"value":"travel","label_es":"Travel","label_fr":"Voyage","label_en":"Travel"}]'::jsonb),
(10, 'booking_occasions',
 '¿Para qué ocasiones reservarías?',
 'Pour quelles occasions réserveriez-vous ?',
 'For which occasions would you book?',
 'multi_select',
 '[{"value":"cena_amigas","label_es":"Cena con amigas","label_fr":"Dîner entre amies","label_en":"Dinner with friends"},{"value":"date","label_es":"Date","label_fr":"Date","label_en":"Date"},{"value":"retreat","label_es":"Retreat","label_fr":"Retraite","label_en":"Retreat"},{"value":"eventos_marca","label_es":"Eventos de marca","label_fr":"Événements de marque","label_en":"Brand events"},{"value":"lanzamiento_producto","label_es":"Lanzamiento de producto","label_fr":"Lancement de produit","label_en":"Product launch"}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  position         = EXCLUDED.position,
  question_text_es = EXCLUDED.question_text_es,
  question_text_fr = EXCLUDED.question_text_fr,
  question_text_en = EXCLUDED.question_text_en,
  question_type    = EXCLUDED.question_type,
  options          = EXCLUDED.options,
  updated_at       = now();


-- ============================================================================
-- End of 010_creator_onboarding_surveys.sql
-- ============================================================================
