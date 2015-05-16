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
SELECT 'left_point_offset', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
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
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[5,3,1] -- widths
))
;

-- Points on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_point_offset', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
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
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[20,100,45], -- distances
  ARRAY[0,0,0], -- lengths
  ARRAY[5,3,1] -- widths
))
;

-- Boxes on the right, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_box_beyond', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  false, -- right side, so external to the angle
  ARRAY[195,200], -- distances
  ARRAY[10,10], -- lengths
  ARRAY[2,2], -- widths
  ARRAY[1,5] -- offsets
))
;

-- Boxes on the left, offsetted
INSERT INTO layoutboxestest1
SELECT 'right_box_beyond', unnest(layoutBoxes(
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
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
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
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
  'LINESTRING(0 0, 100 0, 100 100)'::geometry,
  true, -- left side, so internal to the angle
  ARRAY[200,210], -- distances
  ARRAY[0,0], -- lengths
  ARRAY[0,0], -- widths
  ARRAY[1,3] -- offsets
))
;
