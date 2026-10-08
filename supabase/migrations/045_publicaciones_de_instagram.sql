-- 045: las seis últimas publicaciones de Instagram de cada storyteller.
--
-- Se pedían a Phyllo cada vez que una casa abría un perfil. Phyllo tarda, y
-- pasados seis segundos el perfil salía sin ellas; además los enlaces de las
-- fotos de Instagram caducan a los pocos días. Ahora se guardan: las fotos se
-- copian al bucket creator-portraits (carpeta instagram/) y aquí queda la lista,
-- [{ "url": enlace al post, "path": la foto en el bucket, "publishedAt": … }].
-- Se refrescan al conectar Instagram y, cuando tienen más de un día, la
-- siguiente vez que una casa abre el perfil.
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_posts JSONB;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_posts_at TIMESTAMPTZ;
