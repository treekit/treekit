(function(NS) {
  'use strict';

  NS.Config = {
    map: {
      center: [40.8343, -73.9279],
      zoom: 17,
      maxZoom: 19,
      minZoom: 14
    },
    layers: [
      {
        url: 'http://{s}.tiles.mapbox.com/v3/openplans.map-dmar86ym/{z}/{x}/{y}.png',
        attribution: '<a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>',
        maxZoom: 19
      }
    ],
    cartodb: {
      queryUrl: 'https://treekit.cartodb.com/api/v2/sql/',
      blockfaceTable: 'blockface_live',
      speciesTable: 'species'
    }
  };


}(window.TreeKit = window.TreeKit || {}));