-- Functions, from https://github.com/treekit/treekit/wiki/Named-functions

CREATE OR REPLACE FUNCTION OTK_NewBlockfaceSurvey(blockface_id INTEGER, who TEXT, hastrees BOOLEAN, direction INT, side TEXT, date_collected TIMESTAMP)
    RETURNS INTEGER
    AS $$
    DECLARE
      sql TEXT;
      ret INTEGER;
    BEGIN
    sql := 'INSERT INTO blockface_survey_live(blockface_id, who, hastrees, direction, side, date_collected) VALUES ($1, $2, $3, $4, $5, $6) RETURNING survey_id';
    RAISE DEBUG '%', sql;
    EXECUTE sql USING blockface_id, who, hastrees, direction, side, date_collected INTO ret;
    RETURN ret;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION OTK_NewTree(survey_id INT, circ NUMERIC, dist NUMERIC, fastigiate BOOLEAN, genus TEXT, housenum TEXT, length NUMERIC, orderonstreet INTEGER, tposition TEXT, species TEXT, speciesconfirmed INTEGER, status TEXT, street TEXT, treenum INTEGER, width NUMERIC)
    RETURNS INTEGER
    AS $$
    DECLARE
      sql TEXT;
      ret INTEGER;
    BEGIN
    sql := 'INSERT INTO trees_live(survey_id, circ, dist, fastigiate, genus, housenum, length, orderonstreet, position, species, speciesconfirmed, status, street, treenum, width) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING cartodb_id';
    RAISE DEBUG '%', sql;
    EXECUTE sql USING survey_id, circ, dist, fastigiate, genus, housenum, length, orderonstreet, tposition, species, speciesconfirmed, status, street, treenum, width INTO ret;
    RETURN ret;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION OTK_NewTree(survey_id INT, circ NUMERIC, dist NUMERIC, fastigiate BOOLEAN, genus TEXT, housenum TEXT, length NUMERIC, orderonstreet INTEGER, tposition TEXT, species TEXT, speciesconfirmed INTEGER, status TEXT, street TEXT, treenum INTEGER, width NUMERIC, end_d NUMERIC)
    RETURNS INTEGER
    AS $$
    DECLARE
      sql TEXT;
      ret INTEGER;
    BEGIN
    sql := 'INSERT INTO trees_live(survey_id, circ, dist, fastigiate, genus, housenum, length, orderonstreet, position, species, speciesconfirmed, status, street, treenum, width, end_d) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING cartodb_id';
    RAISE DEBUG '%', sql;
    EXECUTE sql USING survey_id, circ, dist, fastigiate, genus, housenum, length, orderonstreet, tposition, species, speciesconfirmed, status, street, treenum, width, end_d INTO ret;
    RETURN ret;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION OTK_NewNotes(survey_id INT, notes TEXT, quitreason TEXT)
    RETURNS INTEGER
    AS $$
    DECLARE
      sql TEXT;
      ret INTEGER;
    BEGIN
    sql := 'INSERT INTO blockface_notes_live(survey_id, notes, quitreason) VALUES ($1, $2, $3) RETURNING cartodb_id';
    RAISE DEBUG '%', sql;
    EXECUTE sql USING survey_id, notes, quitreason INTO ret;
    RETURN ret;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION OTK_FlagSurvey(survey_id INT)
    RETURNS INTEGER
    AS $$
    DECLARE
      sql TEXT;
      ret INTEGER;
    BEGIN
    sql := 'INSERT INTO flagged_survey_live(survey_id, flagged) VALUES ($1, TRUE) RETURNING cartodb_id';
    RAISE DEBUG '%', sql;
    EXECUTE sql USING survey_id INTO ret;
    RETURN ret;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;
