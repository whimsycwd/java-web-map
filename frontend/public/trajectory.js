



// var map = L.map('map').setView([30.6765553, 104.0612783], 12);
// L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
//     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//     maxZoom: 18
// }).addTo(map);


var map = L.map('map').setView([39.9067,116.3978], 11);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
}).addTo(map);


// http://otile1.mqcdn.com/tiles/1.0.0/map
// http://{s}.tile.osm.org/{z}/{x}/{y}.png
var paintPath = function(sId, tId) {
    $.get("api/map/routing/" + sId + "/" + tId, function(obj){
        var latlngs = [];

        obj.paths.forEach(function(e) {
            latlngs.push(L.latLng(e.y, e.x));

        });
        var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
    });
} 


var ids = [];

map.on('click', function(e) {
//        L.marker(e.latlng).addTo(map);


    $.get("/api/map/nearest/" + e.latlng.lat + "/" + e.latlng.lng, function(data) {
        var marker = L.marker(L.latLng(data.y, data.x));
        marker.addTo(map);


      //  marker.bindPopup("popupContent bla bla").openPopup();
        ids.push(data.id);

        if (ids.length % 2 == 0) {
            paintPath(ids[ids.length - 2], ids[ids.length - 1]);
        }
    });

   // alert(e.latlng);
});



var paintEdge = function(eId) {
    // var eId = $("#edgeId").val();
    $.get("/api/map/edge/" + eId, function(obj) {
        var latlngs = [];

        obj.forEach(function(e) {
            latlngs.push(L.latLng(e.y, e.x));

        });
        var polyline = L.polyline(latlngs, {color: 'blue'}).addTo(map);
    });
};



// paint matched node
//   $.get("/api/map/matchedNode/" , function(obj) {
//        var latlngs = [];
//
//        obj.forEach(function(e) {
//            latlngs.push(L.latLng(e.y, e.x));
//
//        });
//        var polyline = L.polyline(latlngs, {color: 'black'}).addTo(map);
//    });


var paintEdgeObj = function(obj) {
    var latlngs = [];

    obj.forEach(function(e) {
        latlngs.push(L.latLng(e.y, e.x));

    });
    var polyline = L.polyline(latlngs, {color: 'blue'}).addTo(layer);
};







var layer = new L.FeatureGroup();
map.addLayer(layer);

function clearScreen() {
    if (layer) {
        map.removeLayer(layer);
        layer = new L.featureGroup();
        map.addLayer(layer);
    }
}

function paintOriginTraj() {
    var person = $("#personSelect").val();
    var time = $("#timeSelect").val();

    console.log(person + " " + time);

    $.get("/api/map/trajectory/origin/" + person + "/" + time, function(path) {

        var latlngs = [];

        path.forEach(function (e) {
            // L.marker(L.latLng(e.y, e.x)).addTo(map);
            latlngs.push(L.latLng(e.y, e.x));
        });


        var polyline = L.polyline(latlngs, {color: 'red'}).addTo(layer);


    });
}

function paintEdgeTraj() {
    var person = $("#personSelect").val();
    var time = $("#timeSelect").val();


    $.get("/api/map/trajectory/edge/" + person + "/" + time, function(ids) {

         $.get("/api/map/edgesDict", function(dict) {
             ids.forEach(function(id) {
                 if (id) {
                     paintEdgeObj(dict[id].eNodes);
                 }
            });
         });

    });
}

function paintProjTraj() {
    var person = $("#personSelect").val();
    var time = $("#timeSelect").val();

    $.get("/api/map/trajectory/proj/" + person + "/" + time, function(path) {

        var latlngs = [];

        path.forEach(function (e) {
            // L.marker(L.latLng(e.y, e.x)).addTo(map);
            latlngs.push(L.latLng(e.y, e.x));
        });


        var polyline = L.polyline(latlngs, {color: 'black'}).addTo(layer);


    });
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


var personMenu = [
];

var timeSelectSubMenu = {}



function makeSubmenu(value) {

    clearScreen();

    console.log(value);

    $("#timeSelect").html("");

    var timeSelect = timeSelectSubMenu[value];
    timeSelect.forEach(function (entry) {
        $('<option value="'+entry+'">'+ entry +'</option>').appendTo("#timeSelect");
    });
}
function resetSelection() {

    clearScreen();

    $.get("/api/map/select", function(data) {
        personMenu = data.personSelect;
        timeSelectSubMenu = data.timeSelect;
        personMenu.forEach(function (entry) {
            $('<option value="'+entry+'">'+ entry +'</option>').appendTo("#personSelect");
        });

        makeSubmenu(personMenu[0]);
    });

}
