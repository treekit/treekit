/*globals Zepto L Handlebars */

(function(NS, $) {
  'use strict';

  var formTplSource = $('#tree-form-tpl').html(),
      formTemplate = Handlebars.compile(formTplSource),
      optionTplSource = $('#option-tpl').html(),
      optionTemplate = Handlebars.compile(optionTplSource),
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
      speciesByGenus = {},
      endPointLayers, blockfaceLayer,
      i, len, map, featureSelect;


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
      $mapAlert.text('Select a blockface by dragging it to the center...').show();
    }
  }

  function setStyle(layers, style) {
    var i;
    for (i=0; i<layers.length; i++) {
      layers[i].setStyle(style);
    }
  }

  function initMap() {
    map = new L.map('map', NS.Config.map);

    var updateBlockfaces,
        layerUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
        layerAttribution = 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
        layer = L.tileLayer(layerUrl, {
          maxZoom: 18,
          attribution: layerAttribution,
          subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
        }).addTo(map);

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
      featureGroup: blockfaceLayer
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
      $mapAlert.text('Loading map data...').show();
      updateBlockfaces(function() {
        // Prompt the user to use the data now that it's loaded
        $mapAlert.text('Select a blockface by dragging it to the center...');
      });
    });

    // Fetch the blockfaces on init
    $mapAlert.text('Loading map data...').show();
    updateBlockfaces(function() {
      // Prompt the user to use the data now that it's loaded
      $mapAlert.text('Select a blockface by dragging it to the center...');
    });
  }

  // Helper for checking the validity of a form
  function checkFormValidity($form) {
    var valid = true;

    // Note that we've checked this form. Enables smart :invalid styles
    $form.addClass('submitted');

    // For each form element
    $form.find('input, select, textarea').each(function(i, el) {
      if (!el.validity.valid) {
        valid = false;
        $(el).focus();
        el.select();
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
        treeObj.fastigiate = treeObj.fastigiate || false;
        obj.trees.push(treeObj);
      } else {
        $.extend(obj, formToObj(el));
      }
    });

    return obj;
  }

  function initTreeSpecies() {
    var genusField = 'latin_common_genus',
        speciesField = 'latin_species',
        sql = 'SELECT '+genusField+', '+speciesField+' FROM species_list_live ORDER BY ' + genusField,
        genusOptionsHtml;

    $.getJSON(NS.Config.cartodb.queryUrl+'?q=' + sql, function(data){
      console.log(data);

      var len = data.rows.length,
          row, i, genus, species;
      for (i=0; i<len; i++) {
        row = data.rows[i],
        genus = row[genusField],
        species = row[speciesField];

        if (speciesByGenus[genus]) {
          speciesByGenus[genus].push(species);
        } else {
          speciesByGenus[genus] = [species];
        }
      }

      console.log(speciesByGenus);

      // Init form 1
      $formContainer.append(renderTreeForm(treeIndex));
    });
  }

  function renderTreeForm(index) {
    var html = formTemplate({
      index: index,
      genusList: Object.keys(speciesByGenus)
    });

    return html;
  }

  // Get SQL true/false
  function getSqlBoolean(val) {
    return val ? 'TRUE' : 'FALSE';
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
            tree.width+")" +
        "FROM new_survey_id ";

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
  var saveSurvey = function(obj) {
    var sql = getSurveySql(obj);

    $.post(NS.Config.cartodb.queryUrl + '?q=' + sql, function() {
      console.log(arguments);
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
    initTreeSpecies();

    // Init the map when we animate to that page
    $('#startlocation').on('pageAnimationEnd', function(evt, data) {
      if (!map && data.direction === 'in') {
        initMap();
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
    $('body').on('tap click', '.page a.btn-next', function(evt, data) {
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
      var $pageForms = $(this).parents('.page').find('form');

      // If this form is valid
      if (checkFormValidity($pageForms.last())) {

        // Append a new form since the previous is valid
        $formContainer.append(renderTreeForm(++treeIndex));
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
        saveSurvey(obj);

        jqt.goTo('#save', 'slideleft');
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
            options: speciesByGenus[evt.target.value]
          });

      $siblingSpeciesSelect.html(optionsHtml);
    });

    // Manually reload the page since linking to index.html acts weird on IOS
    // Safari apps running in app mode (loads Safari, not reload the page)
    $('body').on('click', 'a[data-refresh="true"]', function(evt) {
      window.location.reload();
    });

    // Save the complete
    $('body').on('click', '.save-btn', function() {
      var obj = serializeEverything();
      saveSurvey(obj);
    });

    $('body').on('click', '.quit-btn', function() {
      var obj = serializeEverything();
      obj.trees = [];
      saveSurvey(obj);
    });

  };

  // Init on document ready
  $(function(){
    NS.init();
  });

}(window.TreeKit = window.TreeKit || {}, Zepto));
