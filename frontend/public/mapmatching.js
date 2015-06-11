



var map = L.map('map').setView([39.982578968682176, 116.2926971912384], 18);
L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
}).addTo(map);


// var map = L.map('map').setView([39.9067,116.3978], 11);
// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//     maxZoom: 18
// }).addTo(map);


var ids = [];
var coordsObj = [];


var coords = [];
var edgeIds = [];
var idx = 0;

var edgesLayer;


var paintEdge = function(eId) {
    // var eId = $("#edgeId").val();
    $.get("/api/map/edge/" + eId, function(obj) {
        var latlngs = [];

        obj.forEach(function(e) {
            latlngs.push(L.latLng(e.y, e.x));

        });
        var polyline = L.polyline(latlngs, {color: 'green'}).addTo(map);
    });
};


function clickHandler(e) {
    // set Matched edgeIds

    ++idx;
    console.log(idx);
    console.log("Choose eId : " + e.target.feature.eId);

    edgeIds.push(e.target.feature.eId);

    paintEdge(e.target.feature.eId);

    startMatch();
}

function genFile() {

    console.log(ids);
    console.log(edgeIds);

    $.ajax({
      method: "POST",
      url: "/api/map/saveNodeIds",
      data : JSON.stringify(ids),
      contentType : "application/json"
    });

    $.ajax({
        method : "POST",
        url : "/api/map/saveEdgeIds",
        data : JSON.stringify(edgeIds),
        contentType : "application/json"
    });

    // $.post("/api/map/saveNodeIds", ids);
    // $.post("/api/map/saveEdgeIds", edgeIds);
}

var isPrematched = false;

var hmmLayer;

function startHMMMatch() {
    isPrematched = true;
    $.ajax({
        method : "PUT",
        url : "/api/map/mapmatching",
        data : JSON.stringify(coordsObj),
        contentType : "application/json"
    }).done(function (data) {

        console.log(data);

        if (hmmLayer) {
            map.removeLayer(hmmLayer);
        }
        data.forEach(function (e) {
            var geoJson = []; // get geoJson using edges;
      

            data.forEach(function (e) {

                var coords = [];

                e.figures.forEach(function (e) {
                    coords.push([e.lon, e.lat]);

                });
            
                geoJson.push({
                    "type" : "Feature",
                    "eId" : e.id,
                    "geometry" : {
                        "type" : "LineString", 
                        "coordinates" : coords
                    }
                });
            });


            hmmLayer = L.geoJson(geoJson, {
                style : {
                    weight: 3,
                    opacity: 1,
                    color: 'cyan',
                    dashArray: '3',
                    fillOpacity: 0.4
                }
          
            });

            map.addLayer(hmmLayer);

        });
    });
}

function startMatch() {

    if (idx == coords.length) {
        // save file
        if (edgesLayer) {
            map.removeLayer(edgesLayer);
        }

        alert("匹配结束");

        return;
    }

    map.off("click", onClick);

    var coord = coordsObj[idx];
    if (edgesLayer) {
        map.removeLayer(edgesLayer);
    }



    $.get("/api/map/nearestEdges/" + coord.lat + "/" + coord.lon + "/10", function (data) {
        // process to get edges;


        var geoJson = []; // get geoJson using edges;
  

        data.forEach(function (e) {

            var coords = [];

            e.figures.forEach(function (e) {
                coords.push([e.lon, e.lat]);

            });
        
            geoJson.push({
                "type" : "Feature",
                "eId" : e.id,
                "geometry" : {
                    "type" : "LineString", 
                    "coordinates" : coords
                }
            });
        });



        edgesLayer = L.geoJson(geoJson, {
            style : style,
            onEachFeature, onEachFeature,
      
        });

        map.addLayer(edgesLayer);
    });





}

// var geoJsonFeature = {
//     "type" : "Feature",
//     "geometry" : {
//         "type" : "LineString",
//         "coordinates" : coords
//     }
// };

// var geoLayer;


var onClick = function(e) {
    L.marker(e.latlng).addTo(map);

    coordsObj.push({ "lat" : e.latlng.lat, "lon" : e.latlng.lng});

    $.get("/api/map/nearest/" + e.latlng.lat + "/" + e.latlng.lng, function(data) {
        // var marker = L.marker(L.latLng(data.y, data.x));

        // var marker = L.marker(L.latLng(e.latlng.lat, e.latlng.lon));
        // marker.addTo(map);


        coords.push([data.x, data.y]);

        // coordsObj.push({ "lat" : data.y, "lon" : data.x});

      //  marker.bindPopup("popupContent bla bla").openPopup();
        ids.push(data.id);

        // if (ids.length == 3) {
        //     var layer = L.geoJson(geoJsonFeature, {
        //         style : style,
        //         onEachFeature : onEachFeature
        //     });

        //     map.addLayer(layer);

        //     geoLayer = layer;
        // }
    });
};


map.on('click', onClick);


function style(feature) {
    return {
        weight: 3,
        opacity: 1,
        color: 'blue',
        dashArray: '3',
        fillOpacity: 0.7
    };
}


// function onEachFeature(feature, layer) {
//     // var mouseoutHandler = createResetHighlightHander(layer);  TODO : Why wrong???
//     layer.on({
//         mouseover : highlightFeature,
//         mouseout : mouseoutHandler,
//         click : clickHandler
//     });
// };


function onEachFeature(feature, layer) {
    // var mouseoutHandler = createResetHighlightHander(layer);  TODO : Why wrong???
    layer.on({
        mouseover : highlightFeature,
        mouseout : mouseoutHandler,
        click : clickHandler
    });
};

function mouseoutHandler(e) {
    edgesLayer.resetStyle(e.target);
};


function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: 'red',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}



