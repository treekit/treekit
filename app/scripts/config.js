(function(NS) {
  'use strict';

  var access_token = 'pk.eyJ1IjoidHJlZWtpdCIsImEiOiJEVkk3Ym1ZIn0.QsmZ0FVaZAw9yfOBBg3qFg';
  NS.Config = {
    map: {
      center: [40.8343, -73.9279],
      zoom: 17,
      maxZoom: 19,
      minZoom: 14
    },
    layers: [
      {
        url: 'http://{s}.tiles.mapbox.com/v4/treekit.l36o6l2e/{z}/{x}/{y}.png?access_token='+access_token,
        attribution: '<a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>',
        maxZoom: 19
      }
    ],
    previewLayers: [
      {
        url: 'http://{s}.tiles.mapbox.com/v4/treekit.l370il9f/{z}/{x}/{y}.png?access_token='+access_token,
        attribution: '<a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>',
        maxZoom: 19
      }
    ],
    cartodb: {
      queryUrl: 'https://treekit.cartodb.com/api/v2/sql/',

      blockfaceTable: 'blockface_live',
      blockfaceSurveyTable: 'blockface_survey_live',
      speciesTable: 'species_list_live',
      treesTable: 'trees_live',
      areasTable: 'survey_areas',

      genusField: 'latin_common_genus',
      speciesField: 'latin_species',
      widelyPlantedField: 'widely_planted'
    }
  };


}(window.TreeKit = window.TreeKit || {}));
