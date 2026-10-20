-- Datos de ejemplo para la casa de prueba Kalatra, con los dos storytellers de
-- prueba (apercu y la cuenta personal de Natalia). Sirven para enseñar cómo se
-- ve la app de una casa con actividad: Demandes con demandas y el calendario
-- lleno, el calendrier con visitas confirmadas y «Vos visiteurs» con el mes y
-- sus cifras.
--
-- No envía correos ni avisos: se escribe directo en la base. Cada fila lleva
-- calendar_event_id = 'curato-ejemplo' para borrarlas todas de una vez (al
-- final del archivo).
--
-- Las visitas hechas llevan dos stories con sus cifras completas, para que
-- no bloqueen las reservas de los dos storytellers. Sus fotos no existen en el
-- almacenamiento, así que la galería del mes sale vacía.

with
  casa as (select id from comercios where name = 'Kalatra' and is_test = true limit 1),
  apercu as (select id from creators where email = 'apercu@curato.test' limit 1),
  natalia as (select id from creators where email = 'nataliafernandezcasas@gmail.com' limit 1),
  filas (quien, cuando, personas, estado, nota, vistas, cuentas, interacciones) as (
    values
      -- Hechas este mes, con sus cifras: llenan «Vos visiteurs».
      ('apercu',  '2026-10-05 13:00', 2, 'completed', null, 4820, 3150, 212),
      ('natalia', '2026-10-09 20:00', 1, 'completed', null, 6310, 4020, 344),
      ('apercu',  '2026-10-14 19:30', 2, 'completed', null, 3900, 2780, 158),
      -- Por responder: salen en Demandes y en cobre en el calendario.
      ('natalia', '2026-10-25 20:00', 2, 'pending_review',
        'Je viendrai avec une amie photographe. Pourrions-nous avoir une table près de la fenêtre pour la lumière ?', null, null, null),
      ('apercu',  '2026-11-07 12:30', 1, 'pending_review',
        'J''aimerais goûter le menu dégustation et parler de la carte des vins avec le sommelier.', null, null, null),
      -- Confirmadas: en verde en el calendario y en «Qui vient».
      ('apercu',  '2026-11-03 19:30', 2, 'confirmed', 'Anniversaire de mon compagnon.', null, null, null),
      ('natalia', '2026-11-06 13:00', 1, 'confirmed', null, null, null, null)
  )
insert into reservations (
  creator_id, venue_id, slot_start, party_size, status, credits_cost, special_requests, calendar_event_id,
  confirmed_at, visited_at, content_photo_paths, reach_stories,
  reach_views, reach_accounts, reach_interactions, reach_source, reach_declared_at
)
select
  case f.quien when 'apercu' then (select id from apercu) else (select id from natalia) end,
  (select id from casa),
  (f.cuando || ' Europe/Paris')::timestamptz,
  f.personas,
  f.estado::reservation_status,
  200,
  f.nota,
  'curato-ejemplo',
  case when f.estado in ('confirmed', 'completed') then (f.cuando || ' Europe/Paris')::timestamptz - interval '3 days' end,
  case when f.estado = 'completed' then (f.cuando || ' Europe/Paris')::timestamptz + interval '10 minutes' end,
  case when f.estado = 'completed' then array[
    'ejemplo/' || replace(f.cuando, ' ', 'T') || '-1.jpg',
    'ejemplo/' || replace(f.cuando, ' ', 'T') || '-2.jpg'
  ] end,
  case when f.estado = 'completed' then jsonb_build_array(
    jsonb_build_object('path', 'ejemplo/' || replace(f.cuando, ' ', 'T') || '-1.jpg',
      'views', round(f.vistas * 0.55), 'accounts', round(f.cuentas * 0.55), 'interactions', round(f.interacciones * 0.6)),
    jsonb_build_object('path', 'ejemplo/' || replace(f.cuando, ' ', 'T') || '-2.jpg',
      'views', f.vistas - round(f.vistas * 0.55), 'accounts', f.cuentas - round(f.cuentas * 0.55),
      'interactions', f.interacciones - round(f.interacciones * 0.6))
  ) end,
  f.vistas,
  f.cuentas,
  f.interacciones,
  case when f.estado = 'completed' then 'manual' end,
  case when f.estado = 'completed' then (f.cuando || ' Europe/Paris')::timestamptz + interval '1 day' end
from filas f
where (select id from casa) is not null;

-- Para borrarlos todos:
-- delete from reservations where calendar_event_id = 'curato-ejemplo';
