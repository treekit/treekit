-- Show tree boxes for surveys with id > 70

WITH recent AS (
  SELECT
    survey_id,
    array_agg(cartodb_id order by orderonstreet) cartodb_id,
    -- assuming with,length,dist are given in feet, we need meters
    array_agg(.3048*width::float order by orderonstreet) width,
    array_agg(.3048*length::float order by orderonstreet) length,
    array_agg(.3048*dist::float order by orderonstreet) dist
  FROM trees_live
    WHERE survey_id > 70
  GROUP BY survey_id
),
aggs AS (
  SELECT
    s.blockface_id,
    CASE WHEN s.direction = -1 THEN false ELSE true END left_side,
    r.cartodb_id, s.who, b.the_geom,
    r.survey_id, width, length, dist
  FROM
    recent r, blockface_survey_live s, blockface_live b
  WHERE
    r.survey_id = s.survey_id AND
    b.blockface_id = s.blockface_id
),
layed AS (
  SELECT
    cartodb_id,
    blockface_id,
    survey_id,
      layoutBoxes(
        ST_Transform(
          st_geometryn(the_geom,1),
          _ST_BestSRID(the_geom::geometry)
        ),
        left_side,
        dist,
        length,
        width
      )
    as tbeds
  FROM aggs
),
unnested AS (
  SELECT
    unnest(cartodb_id) as cartodb_id,
    survey_id,
    blockface_id,
    CDB_TransformToWebmercator(unnest(tbeds)) as the_geom_webmercator
  FROM layed
)
SELECT
  u.*,
  t.orderonstreet,
  t.status,
  t.genus,
  t.species
FROM
  unnested u, trees_live t, blockface_survey_live bs
WHERE
  u.cartodb_id = t.cartodb_id AND
  u.survey_id = bs.survey_id
