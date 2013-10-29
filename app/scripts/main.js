/*globals Zepto L Handlebars */

(function(NS, $) {
  'use strict';

  var formTplSource = $('#tree-form-tpl').html(),
      formTemplate = Handlebars.compile(formTplSource),
      optionTplSource = $('#species-option-tpl').html(),
      optionTemplate = Handlebars.compile(optionTplSource),
      selectBlockfaceMsg = 'Drag the map to choose your block (it will turn red)',
      $formContainer,
      treeIndex = 1,
      $nameInput,
      $nameLabel,
      $mapAlert,
      jqt,
      defaultStyle = {
        opacity: 0.7,
        weight: 2,
        color: '#4575b4',
        clickable: false
      },
      selectStyle = {
        opacity: 0.9,
        weight: 3,
        color: '#ff0000',
        clickable: false
      },
      $mapNextBtn = $('#map-next-btn'),
      speciesByGenus,
      endPointLayers, blockfaceLayer,
      i, len, map, featureSelect, previewMap, lastSurveyId;


  function updateMapState(selectedLayers) {
    var latLngs;

    // Starting the map session. Can't move forward.
    $mapNextBtn.hide();
    // Hide any visible end points
    endPointLayers.clearLayers();

    // Can't choose a start point if more than one block is selected
    if (selectedLayers.length === 1) {
      // Get the lat/lng array for this line
      latLngs = L.GeoJSON.coordsToLatLngs(selectedLayers[0].feature.geometry.coordinates, 1)[0];

      // Set the ID value on the hidden input field for serialization
      $('#blockid').val(selectedLayers[0].feature.properties.blockface_id);

      // Update the user prompt
      $mapAlert.text('Tap your starting point...').show();

      endPointLayers.addLayer(
        L.circleMarker(latLngs[0], L.Util.extend({}, defaultStyle, {
          direction: 1,
          radius: 25,
          clickable: true
        }))
      );

      endPointLayers.addLayer(
        L.circleMarker(latLngs[latLngs.length-1], L.Util.extend({}, defaultStyle, {
          direction: -1,
          radius: 25,
          clickable: true
        }))
      );

    } else {
      $mapAlert.text(selectBlockfaceMsg).show();
    }
  }

  function setStyle(layers, style) {
    var i;
    for (i=0; i<layers.length; i++) {
      layers[i].setStyle(style);
    }
  }

  function initMap() {
    map = L.map('map', NS.Config.map);

    var updateBlockfaces,
        layerConfig, i;

    for (i=0; i<NS.Config.layers.length; i++) {
      layerConfig = NS.Config.layers[i];
      L.tileLayer(layerConfig.url, layerConfig).addTo(map);
    }

    // Add geolocation
    L.control.locate().addTo(map);

    // Init feature group for endpoints
    endPointLayers = L.featureGroup();

    // Init feature group for the blockfaces
    blockfaceLayer = L.geoJson(null, {
      style: defaultStyle
    });

    // Setup the selector tool
    featureSelect = window.featureSelect = L.featureSelect({
      featureGroup: blockfaceLayer,
      selectSize: [8, 8],
      icon: L.divIcon({
        iconSize: [65, 65],
        iconAnchor: [32, 32],
        className: 'leaflet-feature-selector'
      })
    }).addTo(map);

    // Handle selection events
    featureSelect.on('select', function(evt) {
      setStyle(evt.layers, selectStyle);
      updateMapState(featureSelect.layers);
    });

    featureSelect.on('unselect', function(evt) {
      setStyle(evt.layers, defaultStyle);
      updateMapState(featureSelect.layers);
    });

    // Add empty layerGroup for our endpoints
    map.addLayer(endPointLayers);

    // Add empty blockfaces to the map
    map.addLayer(blockfaceLayer);

    endPointLayers.on('click', function(evt) {
      $('#startid').val(evt.layer.options.direction);

      endPointLayers.setStyle(defaultStyle);
      evt.layer.setStyle(selectStyle);

      $mapAlert.text('Click Next to continue...');
      $mapNextBtn.show();
    });

    // Fetch and update the blockface layer with features in the current extent
    updateBlockfaces = function(callback) {
      var sql = NS.Config.cartodb.queryUrl + '?format=GeoJSON&q=' +
          'SELECT * FROM ' + NS.Config.cartodb.blockfaceTable +
          ' WHERE ST_Intersects(the_geom, ST_MakeEnvelope('+map.getBounds().toBBoxString()+',4326))';

      $.getJSON(sql, function(data){
        blockfaceLayer.clearLayers();
        blockfaceLayer.addData(data);

        if (callback) {
          callback(data);
        }
      });
    };

    // Update the blockfaces for those in the current extent on moveend
    map.on('moveend', function(evt) {
      // $mapAlert.text('Loading map data...').show();
      updateBlockfaces(function() {
        // Prompt the user to use the data now that it's loaded
        if (featureSelect.layers.length === 1) {
          $mapAlert.text('Tap your starting point...');
        } else {
          $mapAlert.text(selectBlockfaceMsg);
        }
      });
    });

    // Fetch the blockfaces on init
    // $mapAlert.text('Loading map data...').show();
    updateBlockfaces(function() {
      // Prompt the user to use the data now that it's loaded
      $mapAlert.text(selectBlockfaceMsg);
    });
  }

  function initPreviewMap() {
    previewMap = L.map('previewmap', NS.Config.map);

    var who = $('#mapper-name-input').val(),
        layerConfig, i;

    for (i=0; i<NS.Config.layers.length; i++) {
      layerConfig = NS.Config.layers[i];
      L.tileLayer(layerConfig.url, layerConfig).addTo(previewMap);
    }

    getMostRecentSurveyGeoJson(who, function(data) {
      var layer = L.geoJson(data).addTo(previewMap);
      previewMap.fitBounds(layer.getBounds());
    });

  }

  // Helper for checking the validity of a form
  function checkFormValidity($form) {
    var valid = true;

    // Note that we've checked this form. Enables smart :invalid styles
    $form.addClass('submitted');

    // For each form element
    $form.find('input, select, textarea').each(function(i, el) {
      if ($(el).is(':visible') && !el.validity.valid) {
        valid = false;
        $(el).focus();
        if (el.select) {
          el.select();
        }
        return false;
      }
    });

    return valid;
  }

  // Serialize a form to an object
  function formToObj(formEl) {
    var formArray = $(formEl).serializeArray(),
        obj = {};

    $.each(formArray, function(i, o){
      obj[o.name] = o.value;
    });

    return obj;
  }

  // Look at all the forms on all of the pages and serialize
  function serializeEverything() {
    var obj = {
          datetime: (new Date()).toISOString(),
          trees: []
        },
        treeObj;

    $('form').each(function(i, el) {
      if ($(el).hasClass('treeform')) {
        treeObj = formToObj(el);

        // Special defaults
        treeObj.fastigiate = treeObj.fastigiate || false;
        treeObj.circ = treeObj.circ || 0;
        // 2 is "confirmed"
        treeObj.speciesconfirmed = treeObj.speciesconfirmed || 2;
        treeObj.species = treeObj.species || 'Unknown';
        treeObj.genus = treeObj.genus || 'Unknown';

        obj.trees.push(treeObj);
      } else {
        $.extend(obj, formToObj(el));
      }
    });

    return obj;
  }

  function getTreeSpecies(callback) {
    var sql = 'SELECT DISTINCT ' + NS.Config.cartodb.widelyPlantedField +
          ', initcap(' + NS.Config.cartodb.genusField + ') AS ' + NS.Config.cartodb.genusField +
          ', initcap(' + NS.Config.cartodb.speciesField + ') AS ' + NS.Config.cartodb.speciesField +
          ' FROM ' + NS.Config.cartodb.speciesTable + ' ORDER BY ' +
            NS.Config.cartodb.widelyPlantedField + ', ' +
            NS.Config.cartodb.genusField + ', ' +
            NS.Config.cartodb.speciesField,
        sbg = {};

    $.getJSON(NS.Config.cartodb.queryUrl+'?q=' + sql, function(data){
      var len = data.rows.length,
          row, i, genus, species;

      for (i=0; i<len; i++) {
        row = data.rows[i],
        genus = row[NS.Config.cartodb.genusField],
        species = row[NS.Config.cartodb.speciesField];

        if (!sbg[genus]) {
          sbg[genus] = {common: [], uncommon: []};
        }

        if (row[NS.Config.cartodb.widelyPlantedField]) {
          sbg[genus].common.push(species);
        } else {
          sbg[genus].uncommon.push(species);
        }
      }

      // Init form 1
      callback(sbg);
    });
  }

  function renderTreeForm(index, streetName) {
    var genusList = {},
        html;

    genusList.common = $.map(speciesByGenus, function(val, key) {
      if (val.common.length > 0) {
        return key;
      }
    });

    genusList.uncommon = $.map(speciesByGenus, function(val, key) {
      if (val.common.length === 0) {
        return key;
      }
    });

    html = formTemplate({
      index: index,
      genusList: genusList,
      streetName: streetName
    });

    return html;
  }

  // Get SQL true/false
  function getSqlBoolean(val) {
    return val ? 'TRUE' : 'FALSE';
  }

  // Get SQL for the current user's GeoJSON of the most recent survey
  function getMostRecentSurveyGeoJson(who, callback) {
      var url = NS.Config.cartodb.queryUrl + '?q=' +
          'SELECT survey_id FROM '+ NS.Config.cartodb.blockfaceSurveyTable +
          ' WHERE who = \''+who+'\' ORDER BY created_at DESC LIMIT 1';

      $.getJSON(url, function(data){

        lastSurveyId = data.rows[0].survey_id;

        // this is the nice looking CTE version of the query
        var geoJsonSql = 'WITH recent AS ( ' +
          '  SELECT ' +
          '    survey_id, ' +
          '    array_agg(.3048*width::float order by treenum) width, ' +
          '    array_agg(.3048*length::float order by treenum) length, ' +
          '    array_agg(.3048*dist::float order by treenum) dist, ' +
          '    array_agg(treenum order by treenum) treenum ' +
          '  FROM trees_live ' +
          '  WHERE survey_id = ' + lastSurveyId +
          '  GROUP BY survey_id ' +
          '), ' +
          'aggs AS ( ' +
          '  SELECT ' +
          '    s.blockface_id, ' +
          '    CASE WHEN s.direction = -1 THEN false ELSE true END left_side, ' +
          '    s.cartodb_id, s.who, b.the_geom, ' +
          '    r.survey_id, width, length, dist, treenum ' +
          '  FROM ' +
          '    recent r, blockface_survey_live s, blockface_live b ' +
          '  WHERE ' +
          '    r.survey_id = s.survey_id AND ' +
          '    b.blockface_id = s.blockface_id ' +
          '), ' +
          'layed AS ( ' +
          '  SELECT ' +
          '    survey_id, ' +
          '      layoutBoxes( ' +
          '        ST_Transform( ' +
          '          st_geometryn(the_geom,1), ' +
          '          _ST_BestSRID(the_geom::geometry) ' +
          '        ), ' +
          '        left_side, ' +
          '        dist, ' +
          '        length, ' +
          '        width ' +
          '      ) ' +
          '    as tbeds, ' +
          '    treenum ' +
          '  FROM aggs ' +
          ') ' +
          'SELECT ' +
          '  survey_id, ' +
          '  unnest(treenum) as treenum, ' +
          '  CDB_TransformToWebmercator(unnest(tbeds)) as the_geom_webmercator, ' +
          '  ST_Transform(unnest(tbeds),4326) as the_geom ' +
          'FROM layed',
          geoJsonUrl = NS.Config.cartodb.queryUrl + '?format=GeoJSON&q=' + geoJsonSql;

          $.getJSON(geoJsonUrl, callback);
      });
  }

  // Get the SQL for saving a survey
  function getSurveySql(s) {
    var tree, i, treeSql, noteSql,
        unionSqls = [],
        hasTrees = getSqlBoolean(s.trees.length),
        sql = "SELECT " +
              "OTK_NewBlockfaceSurvey( "+
                s.blockid+"," +
                "'"+s.who+"'," +
                hasTrees+","+
                s.startid+"," +
                "'"+s.datetime+"'::timestamp) as sid ";

    if (s.trees.length > 0 || s.quitreason) {
      sql = "WITH new_survey_id AS ( " + sql + ") ";
    }

    for(i=0; i<s.trees.length; i++) {
      tree = s.trees[i];
      treeSql = "SELECT " +
          "OTK_NewTree( sid, "+
            tree.circ+","+
            tree.dist+","+
            getSqlBoolean(s.fastigiate)+","+
            "'"+tree.genus+"',"+
            "'"+tree.housenum+"',"+
            tree.length+","+
            tree.orderonstreet+","+
            "'"+tree.position+"',"+
            "'"+tree.species+"',"+
            tree.speciesconfirmed+","+
            "'"+tree.status+"',"+
            "'"+tree.street+"',"+
            tree.treenum+","+
            tree.width;

      // if this is the last tree, include the end distance
      if (i+1 === s.trees.length) {
        treeSql = treeSql + "," + s.enddist;
      }

      treeSql = treeSql + ") FROM new_survey_id ";

      unionSqls.push(treeSql);
    }

    if (s.quitreason) {
      noteSql =
        "SELECT "+
          "OTK_NewNotes( sid , '"+ s.quitreason +"')"+
        "FROM new_survey_id";

      unionSqls.push(noteSql);
    }

    sql = sql + unionSqls.join(' UNION ALL ');

    return sql;
  }

  // Save the survey to CartoDB
  var saveSurvey = function(obj, success, error) {
    var sql = getSurveySql(obj);

    $.ajax({
      url: NS.Config.cartodb.queryUrl + '?q=' + sql,
      type: 'POST',
      success: success,
      error: error
    });
  };

  // Init the app
  NS.init = function() {
    $mapAlert = $('#map-alert');
    $nameInput = $('#mapper-name-input'),
    $nameLabel = $('.mapper-name-label'),
    $formContainer = $('#treedetails #forms-container');

    // Save the mapper name
    $nameInput.on('change', function() {
      var val = $(this).val();
      window.localStorage.setItem('mapperName', val);
      $nameLabel.text(val);
    });

    // Init jQT
    jqt = new $.jQTouch({
      addGlossToIcon: false, // turn off
      fixedViewport: false, // turn off
      fullScreen: false, // turn off
      fullScreenClass: 'fullscreen',
      useFastTouch: false,
      icon: null,
      icon4: null, // available in iOS 4.2 and later.
      preloadImages: false,
      startupScreen: null,
      statusBar: 'default', // other options: black-translucent, black
      useTouchScroll: false
    });

    // Fetch and init the tree species list
    getTreeSpecies(function(sbg) {
      speciesByGenus = sbg;
      $formContainer.append(renderTreeForm(treeIndex));
    });

    // Init the map when we animate to that page
    $('#startlocation').on('pageAnimationEnd', function(evt, data) {
      if (!map && data.direction === 'in') {
        initMap();
      }
    });

    $('#preview').on('pageAnimationEnd', function(evt, data) {
      if (!previewMap && data.direction === 'in') {
        initPreviewMap();
      }
    });


    // Autofocus on the first input element, if any
    $('.page').on('pageAnimationEnd', function(evt, data) {
      var $input = $(evt.target).find('input').first();
      if (data.direction === 'in') {
        $input.focus();
      }
    });

    // Store the mapper in local storage
    if (window.localStorage.getItem('mapperName')) {
      $nameInput.val(window.localStorage.getItem('mapperName'));
      $nameLabel.text(window.localStorage.getItem('mapperName'));
      jqt.goTo('#start');
    } else {
      jqt.goTo('#login');
    }

    // Prevent page transition if the current form is invalid
    $('body').on('click', '.page a.btn-next', function(evt, data) {
      // Get a list of forms on this page - could be many
      var $pageForms = $(this).parents('.page').find('form');

      // If this is invalid, then stop all the things
      if (checkFormValidity($pageForms)) {
        jqt.goTo($(this).attr('data-next'), 'slideleft');
      }
    });

    // Append a new form
    $('body').on('click', '#anothertree', function() {
      // Get a list of forms on this page - could be many
      var $pageForms = $(this).parents('.page').find('form.treeform'),
          streetName;

      // If this form is valid
      if (checkFormValidity($pageForms)) {
        streetName = $pageForms.last().find('[name="street"]').val();

        // Append a new form since the previous is valid
        $formContainer.append(renderTreeForm(++treeIndex, streetName));
      }
    });

    // Escape route for no trees on this block
    $('body').on('click', '#no-trees-btn', function() {
      var confirmMsg = 'Are you sure there are no trees? Ready to move to the next block?',
          obj;

      if (window.confirm(confirmMsg)) {
        obj = serializeEverything();
        obj.hastrees = false;
        obj.trees = [];

        // Save the survey with no trees
        saveSurvey(obj, function() {
          jqt.goTo('#thanks', 'slideleft');
        }, function() {
          window.alert('Unable to save. Please try again.');
        });
      }
    });

    // Remove the tree form. Using CSS to only show this button on the last form.
    $('body').on('click', '.remove', function() {
      if (window.confirm('Are you sure you want to remove this tree measurement?')) {
        $(this).parents('form').remove();
        treeIndex--;
      }
    });

    // Set the btn-primary class when a grouped radio button changes
    $('body').on('change', 'input[type="radio"]', function(evt) {
      var $label = $(evt.target).parent('label');
      $label.siblings().removeClass('btn-primary');
      $label.addClass('btn-primary');
    });

    // Update the species list when the genus is selected
    $('body').on('change', 'select[name="genus"]', function(evt) {
      var $parentForm = $(evt.target).parents('.treeform'),
          $siblingSpeciesSelect = $parentForm.find('select[name="species"]'),
          optionsHtml = optionTemplate({
            options: {
              common: speciesByGenus[evt.target.value].common,
              uncommon: speciesByGenus[evt.target.value].uncommon
            }
          });

      $siblingSpeciesSelect.html(optionsHtml);
    });

    // Set the btn-primary class when a grouped radio button changes
    $('body').on('change', '.treeform input[name="status"]', function(evt) {
      var $treeForm = $(evt.target).parents('.treeform'),
          $aliveAttributesContainer = $treeForm.find('.alive-tree-attributes');

      if (evt.target.value !== 'alive') {
        $aliveAttributesContainer.hide();
        $aliveAttributesContainer.find('input, select, textarea').each(function(i, el) {
          $(el).val('');
        });
      } else {
        $aliveAttributesContainer.show();
      }
    });


    // Manually reload the page since linking to index.html acts weird on IOS
    // Safari apps running in app mode (loads Safari, not reload the page)
    $('body').on('click', 'a[data-refresh="true"]', function(evt) {
      window.location.reload();
    });

    // Save the complete
    $('body').on('click', '.save-btn', function() {
      // Get a list of forms on this page - could be many
      var $this = $(this),
          $pageForms = $this.parents('.page').find('form'),
          obj;

      // If this is invalid, then stop all the things
      if (checkFormValidity($pageForms)) {
        obj = serializeEverything();
        saveSurvey(obj, function() {
          jqt.goTo($this.attr('data-next'), 'slideleft');
        }, function() {
          window.alert('Unable to save. Please try again.');
        });
      }
    });

    $('body').on('click', '#bad-preview-btn', function() {
      var $this = $(this),
          sql = 'SELECT OTK_FlagSurvey('+ lastSurveyId +')';

        $.ajax({
          url: NS.Config.cartodb.queryUrl + '?q=' + sql,
          type: 'POST',
          success: function() {
            jqt.goTo($this.attr('data-next'), 'slideleft');
          },
          error: function() {
            window.alert('Unable to save. Please try again.');
          }
        });
    });

    $('body').on('click', '.quit-btn', function() {
      // Get a list of forms on this page - could be many
      var $this = $(this),
          $pageForms = $this.parents('.page').find('form'),
          obj;

      // If this is invalid, then stop all the things
      if (checkFormValidity($pageForms)) {
        obj = serializeEverything();
        obj.trees = [];
        saveSurvey(obj, function() {
          jqt.goTo($this.attr('data-next'), 'slideleft');
        }, function() {
          window.alert('Unable to save. Please try again.');
        });
      }
    });

  };

  // Init on document ready
  $(function(){
    NS.init();
  });

}(window.TreeKit = window.TreeKit || {}, Zepto));
