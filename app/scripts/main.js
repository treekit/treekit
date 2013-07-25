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
      species = {
        'Acer': ['Unknown', 'Species Acer'],
        'Aesculus': ['Unknown', 'Species Aesculus'],
        'Ailanthus': ['Unknown', 'Species Ailanthus'],
        'Amelanchier': ['Unknown', 'Species Amelanchier'],
        'Betula': ['Unknown', 'Species Betula'],
        'Carpinus': ['Unknown', 'Species Carpinus'],
        'Celtis': ['Unknown', 'Species Celtis'],
        'Cercidiphyllum': ['Unknown', 'Species Cercidiphyllum'],
        'Cercis': ['Unknown', 'Species Cercis'],
        'Cornus': ['Unknown', 'Species Cornus'],
        'Crataegus': ['Unknown', 'Species Crataegus'],
        'Eucommia': ['Unknown', 'Species Eucommia'],
        'Fraxinus': ['Unknown', 'Species Fraxinus'],
        'Ginkgo': ['Unknown', 'Species Ginkgo'],
        'Gleditsia': ['Unknown', 'Species Gleditsia'],
        'Gymnocladus': ['Unknown', 'Species Gymnocladus'],
        'Koelreuteria': ['Unknown', 'Species Koelreuteria'],
        'Liquidambar': ['Unknown', 'Species Liquidambar'],
        'Liriodendron': ['Unknown', 'Species Liriodendron'],
        'Maackia': ['Unknown', 'Species Maackia'],
        'Magnolia': ['Unknown', 'Species Magnolia'],
        'Malus': ['Unknown', 'Species Malus'],
        'Metasequoia': ['Unknown', 'Species Metasequoia'],
        'Morus': ['Unknown', 'Species Morus'],
        'Pinus': ['Unknown', 'Species Pinus'],
        'Platanus': ['Unknown', 'Species Platanus'],
        'Populus': ['Unknown', 'Species Populus'],
        'Prunus': ['Unknown', 'Species Prunus'],
        'Pyrus': ['Unknown', 'Species Pyrus'],
        'Quercus': ['Unknown', 'Species Quercus'],
        'Robinia': ['Unknown', 'Species Robinia'],
        'Styphnolobium': ['Unknown', 'Species Styphnolobium'],
        'Syringa': ['Unknown', 'Species Syringa'],
        'Taxodium': ['Unknown', 'Species Taxodium'],
        'Tilia': ['Unknown', 'Species Tilia'],
        'Ulmus': ['Unknown', 'Species Ulmus'],
        'Zelkova': ['Unknown', 'Species Zelkova']
      },
      $mapNextBtn = $('#map-next-btn'),
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
    if (!map) {
      map = new L.map('map');

      var layerUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
          layerAttribution = 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
          layer = L.tileLayer(layerUrl, {
            maxZoom: 18,
            attribution: layerAttribution,
            subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
          }).addTo(map);

      // Add geolocation
      L.control.locate().addTo(map);

      // Init layer group for endpoints
      endPointLayers = L.featureGroup();

      // Add empty layerGroup for our endpoints
      map.addLayer(endPointLayers);

      endPointLayers.on('click', function(evt) {
        $('#startid').val(evt.layer.options.direction);

        endPointLayers.setStyle(defaultStyle);
        evt.layer.setStyle(selectStyle);

        $mapAlert.text('Click Next to continue...');
        $mapNextBtn.show();
      });
    }

    // Fetch the blockfaces from CartoDB
    $.getJSON('http://treekit.cartodb.com/api/v2/sql/?format=GeoJSON&q=SELECT%20*%20FROM%20blockface_live', function(data){
      blockfaceLayer = L.geoJson(data, {
        style: defaultStyle
      });

      // Zoom to the center of the blockfaces
      map.setView(blockfaceLayer.getBounds().getCenter(), 17);

      // Setup the selector tool
      featureSelect = window.featureSelect = L.featureSelect({
        layerGroup: blockfaceLayer
      }).addTo(map);

      // Add blockfaces to the map
      map.addLayer(blockfaceLayer);

      // Handle selection events
      featureSelect.on('select', function(evt) {
        setStyle(evt.layers, selectStyle);
        updateMapState(featureSelect.layers);
      });

      featureSelect.on('unselect', function(evt) {
        setStyle(evt.layers, defaultStyle);
        updateMapState(featureSelect.layers);
      });

      // Prompt the user to use the data now that it's loaded
      $mapAlert.text('Select a blockface by dragging it to the center...');
    });

    // Let the user know we're fetching data
    $mapAlert.text('Loading map data...').show();
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

  // Save the survey to CartoDB
  function saveSurvey(obj) {
    console.log('Save this', obj);
  }

  // Init the app
  NS.init = function() {
    $mapAlert = $('#map-alert');
    $nameInput = $('#mapper-name-input'),
    $nameLabel = $('.mapper-name-label'),
    $formContainer = $('#treedetails #forms-container');

    // Init form 1
    $formContainer.append(formTemplate({
      index: treeIndex
    }));

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
      statusBar: 'default' // other options: black-translucent, black
    });

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
    $('.page a.btn-next').on('click', function(evt, data) {
      // Get a list of forms on this page - could be many
      var $pageForms = $(this).parents('.page').find('form');

      // If this is invalid, then stop all the things
      if (!checkFormValidity($pageForms)) {
        return false;
      }
    });

    // Append a new form
    $('#anothertree').on('click', function() {
      // Get a list of forms on this page - could be many
      var $pageForms = $(this).parents('.page').find('form');

      // If this form is valid
      if (checkFormValidity($pageForms.last())) {

        // Append a new form since the previous is valid
        $formContainer.append(formTemplate({
          index: ++treeIndex
        }));
      }
    });

    // Escape route for no trees on this block
    $('#no-trees-btn').on('click', function() {
      var confirmMsg = 'Are you sure there are no trees? Ready to move to the next block?',
          obj;

      if (window.confirm(confirmMsg)) {
        obj = serializeEverything();
        obj.hastrees = false;
        obj.trees = [];

        // Save the survey with no trees
        saveSurvey(obj);

        jqt.goTo('#save');
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
            options: species[evt.target.value]
          });

      $siblingSpeciesSelect.html(optionsHtml);
    });

    // Manually reload the page since linking to index.html acts weird on IOS
    // Safari apps running in app mode (loads Safari, not reload the page)
    $('a[data-refresh="true"]').on('click', function(evt) {
      window.location.reload();
    });

    // Save the complete
    $('#save-btn').on('click', function() {
      var obj = serializeEverything();
      saveSurvey(obj);
    });
  };

  // Init on document ready
  $(function(){
    NS.init();
  });

}(window.TreeKit = window.TreeKit || {}, Zepto));
