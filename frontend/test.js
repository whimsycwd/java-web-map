 var request = require("request");

 request("http://www.baidu.com",
        {
        method : "GET",
        // url : CONFIG.BACKEND_URL + "/api/map/mapmatching",
        // uri : "http://127.0.0.1:8080/api/map/mapmatching",

    }, function (err, response, body) {
        console.log(err);
        console.log(response.statusCode);
        if (!err && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage. 

         
        }
    });