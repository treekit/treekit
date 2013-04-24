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
        '100': [40.6799730691326, -73.9894885689526],
        '101': [40.6791627598675, -73.9874064112064],
        '102': [40.6798846867123, -73.9895462914959],
        '103': [40.6790763162354, -73.9874653858336],
        '104': [40.6790763162354, -73.9874653858336],
        '105': [40.6778874158229, -73.9882713883809],
        '106': [40.6778529539171, -73.9881860768339],
        '107': [40.6771357495325, -73.9863391440943],
        '108': [40.6784141510259, -73.9878038160408],
        '109': [40.6776972649985, -73.9859618502971],
        '110': [40.6784873666764, -73.9877572631041],
        '111': [40.6790434556787, -73.9873819971489],
        '112': [40.6783248922489, -73.9855374751128],
        '113': [40.6777719614761, -73.9859114916668],
        '114': [40.6803541866844, -73.9866027780511],
        '115': [40.6791317178005, -73.9873184663572],
        '116': [40.6796806801732, -73.9869484946735],
        '117': [40.6789692537774, -73.9850985789912],
        '118': [40.6784128309048, -73.9854711014195],
        '119': [40.6797598352688, -73.9868953690466],
        '120': [40.6803164969259, -73.9865154774295],
        '121': [40.6796014026842, -73.9846716249001],
        '122': [40.6790411891506, -73.985047784531]
      },
      layerData = [
        {
          id: '500',
          ends: ['100', '101'],
          line: [[40.6799730691326, -73.9894885689526], [40.6791627598675, -73.9874064112064]]
        },
        {
          id: '501',
          ends: ['102', '103'],
          line: [[40.6798846867123, -73.9895462914959], [40.6790763162354, -73.9874653858336]]
        },
        {
          id: '502',
          ends: ['104', '105'],
          line: [[40.6790763162354, -73.9874653858336], [40.6778874158229, -73.9882713883809]]
        },
        {
          id: '503',
          ends: ['106', '107'],
          line: [[40.6778529539171, -73.9881860768339], [40.6771357495325, -73.9863391440943]]
        },
        {
          id: '504',
          ends: ['106', '108'],
          line: [[40.6778529539171, -73.9881860768339], [40.6784141510259, -73.9878038160408]]
        },
        {
          id: '505',
          ends: ['108', '109'],
          line: [[40.6784141510259, -73.9878038160408], [40.6776972649985, -73.9859618502971]]
        },
        {
          id: '506',
          ends: ['109', '107'],
          line: [[40.6776972649985, -73.9859618502971], [40.6771357495325, -73.9863391440943]]
        },
        {
          id: '507',
          ends: ['110', '111'],
          line: [[40.6784873666764, -73.9877572631041], [40.6790434556787, -73.9873819971489]]
        },
        {
          id: '508',
          ends: ['111', '112'],
          line: [[40.6790434556787, -73.9873819971489], [40.6783248922489, -73.9855374751128]]
        },
        {
          id: '509',
          ends: ['112', '113'],
          line: [[40.6783248922489, -73.9855374751128], [40.6777719614761, -73.9859114916668]]
        },
        {
          id: '510',
          ends: ['113', '110'],
          line: [[40.6777719614761, -73.9859114916668], [40.6784873666764, -73.9877572631041]]
        },
        {
          id: '511',
          ends: ['101', '114'],
          line: [[40.6791627598675, -73.9874064112064], [40.6803541866844, -73.9866027780511]]
        },
        {
          id: '512',
          ends: ['115', '116'],
          line: [[40.6791317178005, -73.9873184663572], [40.6796806801732, -73.9869484946735]]
        },
        {
          id: '513',
          ends: ['116', '117'],
          line: [[40.6796806801732, -73.9869484946735], [40.6789692537774, -73.9850985789912]]
        },
        {
          id: '514',
          ends: ['117', '118'],
          line: [[40.6789692537774, -73.9850985789912], [40.6784128309048, -73.9854711014195]]
        },
        {
          id: '515',
          ends: ['118', '115'],
          line: [[40.6784128309048, -73.9854711014195], [40.6791317178005, -73.9873184663572]]
        },
        {
          id: '516',
          ends: ['119', '120'],
          line: [[40.6797598352688, -73.9868953690466], [40.6803164969259, -73.9865154774295]]
        },
        {
          id: '517',
          ends: ['120', '121'],
          line: [[40.6803164969259, -73.9865154774295], [40.6796014026842, -73.9846716249001]]
        },
        {
          id: '518',
          ends: ['121', '122'],
          line: [[40.6796014026842, -73.9846716249001], [40.6790411891506, -73.985047784531]]
        },
        {
          id: '519',
          ends: ['122', '119'],
          line: [[40.6790411891506, -73.985047784531], [40.6797598352688, -73.9868953690466]]
        }
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
      center: [40.6785, -73.9868],
      zoom: 18
    });

    var layerUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
        layerAttribution = 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
        layer = L.tileLayer(layerUrl, {
          maxZoom: 18,
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

    $('body').on('change', 'input[type="radio"]', function(evt) {
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
