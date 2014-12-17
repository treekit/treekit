\i layoutBoxes.sql

DROP TABLE IF EXISTS layoutboxestest1;
CREATE TABLE layoutboxestest1 ( lbl text, g geometry );

-- Boxes on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'left_box', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
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
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[20,90,40], -- distances
  ARRAY[10,5,10], -- lengths
  ARRAY[2,12,8], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Points on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'left_point', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[0,0,0], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Points on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_point', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- left side, so internal to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[0,0,0], -- widths
  ARRAY[5,3,1] -- offsets
))
;

-- Points on the right, using width for offset
INSERT INTO layoutboxestest1
SELECT 'right_point', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- left side, so internal to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[15,13,11] -- widths
))
;

