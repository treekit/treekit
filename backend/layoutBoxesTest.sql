\i layoutBoxes.sql

DROP TABLE IF EXISTS layoutboxestest1;
CREATE TABLE layoutboxestest1 ( lbl text, g geometry );

-- Boxes on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'left_box', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[20,90,40], -- distances
  ARRAY[10,5,10], -- lengths
  ARRAY[2,12,8], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Boxes on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_box', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[20,90,40], -- distances
  ARRAY[10,5,10], -- lengths
  ARRAY[2,12,8], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Points on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'left_point_offset', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[0,0,0], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Points on the left, using width for offset
INSERT INTO layoutboxestest1
SELECT 'left_point_width', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[5,3,1] -- widths
))
;

-- Points on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_point_offset', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[0,0,0], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Points on the right, using width for offset
INSERT INTO layoutboxestest1
SELECT 'right_point_width', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[5,3,1] -- widths
))
;

-- Boxes on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_box_beyond', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[195,200], -- distances
  ARRAY[10,10], -- lengths
  ARRAY[2,2], -- widths
  ARRAY[1,5] -- offsets
))
;

-- Boxes on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'left_box_beyond', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[195,200], -- distances
  ARRAY[10,10], -- lengths
  ARRAY[2,2], -- widths
  ARRAY[1,5] -- offsets
))
;

-- Points on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_point_beyond', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[200,210], -- distances
  ARRAY[0,0], -- lengths
  ARRAY[0,0], -- widths
  ARRAY[1,3] -- offsets
))
;

-- Points on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'left_point_beyond', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[200,210], -- distances
  ARRAY[0,0], -- lengths
  ARRAY[0,0], -- widths
  ARRAY[1,3] -- offsets
))
;

-- Point on the left, very close to the end
INSERT INTO layoutboxestest1
SELECT 'left_point_close_to_end', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side
  ARRAY[199.999999], -- distances
  ARRAY[0], -- lengths
  ARRAY[0], -- widths
  ARRAY[5] -- offsets
))
;

-- Point on the left, very close to the end, using width for offset
INSERT INTO layoutboxestest1
SELECT 'left_point_close_to_end', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side
  ARRAY[199.999999], -- distances
  ARRAY[0], -- lengths
  ARRAY[7], -- widths
  ARRAY[0] -- offsets
))
;

-- Point on the right, very close to the end
INSERT INTO layoutboxestest1
SELECT 'right_point_close_to_end', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side
  ARRAY[199.999999], -- distances
  ARRAY[0], -- lengths
  ARRAY[0], -- widths
  ARRAY[5] -- offsets
))
;

-- Point on the right, very close to the end, using width for offset
INSERT INTO layoutboxestest1
SELECT 'right_point_close_to_end_width', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side
  ARRAY[199.999999], -- distances
  ARRAY[0], -- lengths
  ARRAY[7], -- widths
  ARRAY[0] -- offsets
))
;

-- Short block layout
-- See https://github.com/azavea/nyc-trees/issues/1728
INSERT INTO layoutboxestest1
SELECT 'right_point_on_short_line', unnest(layoutBoxes(
  'SRID=4326;LINESTRING(0 0,31 0)',
  false, -- right side
  ARRAY[30], -- dist
  ARRAY[0], -- length
  ARRAY[5] -- width (2 works, 3 fails)
))
;
