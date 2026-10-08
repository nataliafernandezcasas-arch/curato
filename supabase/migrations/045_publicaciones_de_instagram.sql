-- 045: Instagram al día, solo.
--
-- Los seguidores y las seis últimas publicaciones de cada storyteller se
-- actualizan cada día con la API oficial de Instagram (Business Discovery,
-- con la cuenta de Curato), sin que nadie edite nada a mano. Las fotos se
-- copian al bucket creator-portraits (carpeta instagram/), porque los enlaces
-- de Instagram caducan en pocos días; aquí queda la lista:
--   [{ "url": enlace al post, "path": la foto en el bucket, "publishedAt": … }]
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_posts JSONB;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_posts_at TIMESTAMPTZ;
-- Los seguidores según Instagram, y cuándo se miró por última vez.
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_followers INTEGER;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_synced_at TIMESTAMPTZ;
-- Por qué no se pudo actualizar (p. ej. una cuenta personal), para el admin.
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_error TEXT;
