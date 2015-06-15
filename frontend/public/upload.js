
var map = L.map('map').setView([39.9067,116.3978], 11);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
}).addTo(map);


var layer = new L.FeatureGroup();
map.addLayer(layer);

function clearScreen() {
    if (layer) {
        map.removeLayer(layer);
        layer = new L.featureGroup();
        map.addLayer(layer);
    }
}

function displayNodeTraj() {
    $.get("/api/map/trajectory/nodeFile", function(path) {
        var latlngs = [];
        path.forEach(function (e) {
            latlngs.push(L.latLng(e.y, e.x));
        });

        var polyline = L.polyline(latlngs, {color: 'red'}).addTo(layer);
    })

}


var paintEdgeObj = function(obj) {
    var latlngs = [];

    obj.forEach(function(e) {
        latlngs.push(L.latLng(e.y, e.x));

    });
    var polyline = L.polyline(latlngs, {color: 'blue'}).addTo(layer);
};




function displayEdgeTraj() {
    $.get("/api/map/trajectory/edgeFile", function(ids) {
        $.get("/api/map/edgesDict", function(dict) {
             ids.forEach(function(id) {
                 if (id) {
                     paintEdgeObj(dict[id].eNodes);
                 }
            });
         });
    })

}
