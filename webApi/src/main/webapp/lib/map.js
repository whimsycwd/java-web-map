


var WIDTH = 1000;
var HEIGHT = 500;

var factor = 1.2;


// global

var originBound;

var bound;
var wayMap;

function draw(bound, wayMap) {

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d")


    ctx.clearRect ( 0 , 0 , canvas.width, canvas.height);

    function calcX(x) {
        return (x - bound.minLon) / (bound.maxLon - bound.minLon) * WIDTH;
    }
    function calcY(y) {
        return (y - bound.minLat) / (bound.maxLat - bound.minLat) * HEIGHT;
    }

    for (var property in wayMap) {
        if (wayMap.hasOwnProperty(property)) {
            var way = wayMap[property];

            ctx.beginPath();
            var nodes = way.rnodes;
            for (var i = 0; i < nodes.length; ++i) {
                var px = calcX(nodes[i].longtitude);
                var py = calcY(nodes[i].latitude);


                if (i == 0) {
                    ctx.moveTo(calcX(nodes[i].longtitude), calcY(nodes[i].latitude));
                } else {
                    ctx.lineTo(calcX(nodes[i].longtitude), calcY(nodes[i].latitude));
                }
            }

            ctx.stroke();

        }
    }
}


$.ajax({
    url : "/api/map",
    success : function(data) {
        $("#console").html(""+data);




        bound = data.bound;

        originBound = bound;

        wayMap = data.wayMap;

        draw(bound, wayMap);

    }
});




function initianlise() {
    var canvas = document.getElementById("canvas");
    canvas.addEventListener("dblclick", doZoomIn, false);
    $("canvas").on("mousewheel", function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopImmediatePropagation();

            // perform desired zoom action here
            doZoomOut(event);
        }
    });


}





// Zoom out
// TODO : use pinch
function doZoomOut(event) {

    var latLen = (bound.maxLat - bound.minLat) * factor;
    var lonLen = (bound.maxLon - bound.minLon) * factor;

    var newBound = {};

    newBound.minLat = (bound.maxLat + bound.minLat) / 2 - latLen / 2;
    newBound.maxLat = (bound.maxLat + bound.minLat) / 2 + latLen / 2;
    newBound.minLon = (bound.maxLon + bound.minLon) / 2 - lonLen / 2;
    newBound.maxLon = (bound.maxLon + bound.minLon) / 2 + lonLen / 2;

    bound = newBound;

    if (newBound.minLat < originBound.minLat) {
        newBound.minLat = originBound.minLat;
    }

    if (newBound.maxLat > originBound.maxLat) {
        newBound.maxLat = originBound.maxLat;
    }

    if (newBound.minLon < originBound.minLon) {
        newBound.minLon =  originBound.minLon;
    }

    if (newBound.maxLon > originBound.maxLon) {
        newBound.maxLon = originBound.maxLon;
    }

    bound = newBound;
    draw(bound, wayMap);

}




// Zoom in
function doZoomIn(event) {
    var offset = $("canvas").offset();
    canvas_x = event.pageX - offset.left;
    canvas_y = event.pageY - offset.top;





    //alert("X = " + canvas_x + " Y = " + canvas_y);

    var latLen = (bound.maxLat - bound.minLat) / factor;
    var lonLen = (bound.maxLon - bound.minLon) / factor;


    var clickPoint = {};

    clickPoint.x = bound.minLon + (canvas_x / WIDTH);
    clickPoint.y = bound.minLat + (canvas_y / HEIGHT);


    var newBound = {};
    newBound.minLon = clickPoint.x - lonLen / 2;
    newBound.maxLon = clickPoint.x + lonLen / 2;

    newBound.minLat = clickPoint.y - latLen / 2;
    newBound.maxLat = clickPoint.y + latLen / 2;

    if (newBound.minLon < bound.minLon) {
        newBound.maxLon += bound.minLon - newBound.minLon;
        newBound.minLon = bound.minLon;
    }

    if (newBound.minLat < bound.minLat) {
        newBound.maxLat += bound.minLat -newBound.minLat;
        newBound.minLat = bound.minLat;
    }

    if (newBound.maxLon > bound.maxLon) {
        newBound.minLon -= newBound.maxLon - bound.maxLon;
        newBound.maxLon = bound.maxLon;
    }

    if (newBound.maxLat > bound.maxLat) {
        newBound.minLat -= newBound.maxLat - bound.maxLat;
        newBound.maxLat = bound.maxLat;
    }

    bound = newBound;



    draw(bound, wayMap);
}