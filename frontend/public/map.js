

var startObj = {}
// obj to store markers


function chooseStart(idx) {
    map.removeLayer(startObj.layer);

    var marker = startObj.markers[idx];
    marker.unbindPopup();
    marker.addTo(map);
    startObj.point = marker.getLatLng();
}

var endObj = {}
function chooseEnd(idx) {
    map.removeLayer(endObj.layer);

    var marker = endObj.markers[idx];
    marker.unbindPopup();
    marker.addTo(map);
    endObj.point = marker.getLatLng();
}

function route() {
    var source = startObj.point;
    var target = endObj.point;

    if (source == null) {
        alert("起点未选择");
        return false;
    }
    if (target == null) {
        alert("终点未选择");
        return false;
    }
    $.get("/api/map/nearest/"+ source.lng + "/" + source.lat, function(data) {
        var sId = data.id;
    
        $.get("/api/map/nearest/" + target.lng + "/" + target.lat,  function(data) {
            var tId = data.id;
            paintPath(sId, tId);
        });
    });
};

$( "#source" ).autocomplete({


  // 
  source: function( request, response ) {
    $.ajax({
      url: "http://127.0.0.1:8080/api/map/suggest/",
      dataType: "jsonp",
      data: {
        q: request.term
      },
      success: function( data ) {
        response( data );
      }
    });
  },

 select : function (event, ui) {
    var queryStr = ui.item.value;
    $.get("api/map/findNodes/" + queryStr, function(data){

        var markersLayer = new L.FeatureGroup();
        var markers = [];

        var idx = 0;
        data.forEach(function(item){

            var popupContent = '<input id="startButton"class="btn btn-default" type="button" onclick="chooseStart('+idx+');" value="选为起点">';
            var marker = L.marker(L.latLng(item.y, item.x));
            marker.addTo(map);

            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
            markers.push(marker);


            ++idx;
        });

        map.addLayer(markersLayer);
        startObj.layer = markersLayer;
        startObj.markers = markers;
    });

  },

  minLength: 1
});




$( "#target" ).autocomplete({
 source: function( request, response ) {
    $.ajax({
      url: "http://127.0.0.1:8080/api/map/suggest/",
      dataType: "jsonp",
      data: {
        q: request.term
      },
      success: function( data ) {
        response( data );
      }
    });
  },

 select : function (event, ui) {
    var queryStr = ui.item.value;
    $.get("api/map/findNodes/" + queryStr, function(data){

        var markersLayer = new L.FeatureGroup();
        var markers = [];

        var idx = 0;
        data.forEach(function(item){

            var popupContent = '<input id="startButton"class="btn btn-default" type="button" onclick="chooseEnd('+idx+');" value="选为终点">';
            var marker = L.marker(L.latLng(item.y, item.x));
            marker.addTo(map);

            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
            markers.push(marker);


            ++idx;
        });

        map.addLayer(markersLayer);
        endObj.layer = markersLayer;
        endObj.markers = markers;
    });

  },

  minLength: 1
});

// var map = L.map('map').setView([30.6765553, 104.0612783], 12);
// L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
//     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//     maxZoom: 18
// }).addTo(map);


var map = L.map('map').setView([39.9067,116.3978], 12);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
}).addTo(map);


// http://otile1.mqcdn.com/tiles/1.0.0/map
// http://{s}.tile.osm.org/{z}/{x}/{y}.png
var paintPath = function(sId, tId) {
    $.get("api/map/routing/" + sId + "/" + tId, function(data){
        var obj = data;

        var latlngs = [];

        obj.paths.forEach(function(e) {
            latlngs.push(L.latLng(e.y, e.x));

        });
        var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
    });
} 


var ids = [];

//     map.on('click', function(e) {
// //        L.marker(e.latlng).addTo(map);
    

//         $.get("/api/map/nearest/" + e.latlng.lng + "/" + e.latlng.lat, function(data) {
//             var marker = L.marker(L.latLng(data.y, data.x));
//             marker.addTo(map);


//             marker.bindPopup("popupContent <input type='text' />").openPopup();
//             ids.push(data.id);

//             if (ids.length % 2 == 0) {
//                 paintPath(ids[ids.length - 2], ids[ids.length - 1]);
//             }
//         });

//        // alert(e.latlng);
//     });
