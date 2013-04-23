/*globals Zepto L Handlebars */

(function(NS, $) {
  'use strict';

  var tplSource = $('#tree-form-tpl').html(),
      formTemplate = Handlebars.compile(tplSource),
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
      ends = {
        '100': [40.721273, -74.001453],
        '101': [40.721627, -74.002180],
        '102': [40.722536, -74.001400],
        '103': [40.722180, -74.000681],

        '104': [40.720865, -74.000665],
        '105': [40.721259, -74.001421],
        '106': [40.722160, -74.000649],
        '107': [40.721790, -73.999882]
      },
      layerData = [
        {
          id: '500',
          ends: ['100', '101'],
          line: [[40.721273, -74.001453], [40.721627, -74.002180]]
        },
        {
          id: '501',
          ends: ['101', '102'],
          line: [[40.721627, -74.002180], [40.722536, -74.001400]]
        },
        {
          id: '502',
          ends: ['102', '103'],
          line: [[40.722536, -74.001400], [40.722180, -74.000681]]
        },
        {
          id: '503',
          ends: ['103', '100'],
          line: [[40.722180, -74.000681], [40.721273, -74.001453]]
        },

        {
          id: '504',
          ends: ['104', '105'],
          line: [[40.720865, -74.000665], [40.721259, -74.001421]]
        },
        {
          id: '505',
          ends: ['105', '106'],
          line: [[40.721259, -74.001421], [40.722160, -74.000649]]
        },
        {
          id: '506',
          ends: ['106', '107'],
          line: [[40.722160, -74.000649], [40.721790, -73.999882]]
        },
        {
          id: '507',
          ends: ['107', '104'],
          line: [[40.721790, -73.999882], [40.720865, -74.000665]]
        },
      ],
      layerGroup = L.featureGroup([]),
      endLayers = L.featureGroup([]),
      $mapNextBtn = $('#map-next-btn'),
      i, len, map, featureSelect;

  for(i=0, len=layerData.length; i<len; i++) {
    layerGroup.addLayer(L.polyline(layerData[i].line, L.Util.extend({id: layerData[i].id, ends: layerData[i].ends}, defaultStyle)));
  }

  endLayers.on('click', function(evt) {
    $('#startid').val(evt.layer.options.id);

    endLayers.setStyle(defaultStyle);
    evt.layer.setStyle(selectStyle);

    $mapAlert.text('Click Next to continue...');
    $mapNextBtn.show();
  });


  function updateMapState(selectedLayers) {
    var i, endIds;

    $mapNextBtn.hide();
    endLayers.clearLayers();

    if (selectedLayers.length === 1) {
      $('#blockid').val(selectedLayers[0].options.id);

      $mapAlert.text('Tap your starting point...').show();
      endIds = selectedLayers[0].options.ends;

      endLayers.clearLayers();
      for (i=0; i<endIds.length; i++) {
        endLayers.addLayer(
          L.circleMarker(ends[endIds[i]], L.Util.extend({}, defaultStyle, {
            id: endIds[i],
            radius: 25,
            clickable: true
          }))
        );
      }
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
    map = new L.map('map', {
      center: [40.721879, -74.001432],
      zoom: 18
    });

    var layerUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
        layerAttribution = 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
        layer = L.tileLayer(layerUrl, {
          maxZoom: 19,
          attribution: layerAttribution,
          subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
        }).addTo(map);

    // Add geolocation
    L.control.locate().addTo(map);

    featureSelect = window.featureSelect = L.featureSelect({
      layerGroup: layerGroup
    }).addTo(map);

    map.addLayer(layerGroup).addLayer(endLayers);

    featureSelect.on('select', function(evt) {
      setStyle(evt.layers, selectStyle);

      updateMapState(featureSelect.layers);
    });

    featureSelect.on('unselect', function(evt) {
      setStyle(evt.layers, defaultStyle);

      updateMapState(featureSelect.layers);
    });

    $mapAlert.text('Select a blockface by dragging it to the center...').show();
  }

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

  function formToObj(formEl) {
    var formArray = $(formEl).serializeArray(),
        obj = {};

    $.each(formArray, function(i, o){
      obj[o.name] = o.value;
    });

    return obj;
  }

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

    if (window.localStorage.getItem('mapperName')) {
      $nameInput.val(window.localStorage.getItem('mapperName'));
      $nameLabel.text(window.localStorage.getItem('mapperName'));
      jqt.goTo('#start');
    } else {
      jqt.goTo('#login');
    }

    // Prevent page transition if the current form is invalid
    $('.page a.btn-next').on('tap', function(evt, data) {
      // Get a list of forms on this page - could be many
      var $pageForms = $(this).parents('.page').find('form');

      // If this is invalid, then stop propagation
      if (!checkFormValidity($pageForms)) {
        evt.stopPropagation();
      }
    });

    // Append a new form
    $('#anothertree').on('tap', function() {
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

    // Remove the tree form. Using CSS to only show this button on the last form.
    $('body').on('tap', '.remove', function() {
      if (window.confirm('Are you sure you want to remove this tree measurement?')) {
        $(this).parents('form').remove();
        treeIndex--;
      }
    });

    $('input[type="radio"]').on('change', function(evt) {
      var $label = $(evt.target).parent('label');
      $label.siblings().removeClass('btn-primary');
      $label.addClass('btn-primary');
    });

    $('a[data-refresh="true"]').on('tap', function(evt) {
      window.location.reload();
    });

    $('#save-btn').on('tap', function() {
      var obj = serializeEverything();

      console.log('Save this', obj);
    });
  };

  // Init on document ready
  $(function(){
    NS.init();
  });

}(window.TreeKit = window.TreeKit || {}, Zepto));
