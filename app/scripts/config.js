(function(NS) {
  'use strict';

  NS.Config = {
    map: {
      center: [40.8343, -73.9279],
      zoom: 17
    },
    cartodb: {
      queryUrl: 'https://treekit.cartodb.com/api/v2/sql/',
      blockfaceTable: 'blockface_live',
      speciesTable: 'species'
    }
  };


}(window.TreeKit = window.TreeKit || {}));