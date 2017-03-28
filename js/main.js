//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap(){


    //map frame dimensions
    var width = 960,
        height = 550;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on California
    var projection = d3.geoAlbers()
        // specifies the [longitude, latitude] coordinates of the center of the plane
        .center([0, 37.5])
        //specifies the [longitude, latitude, and roll] angles by which to rotate the globe
        .rotate([120, 0])
        //specifies the two standard parallels of a conic projection
        .parallels([29.5, 45.5])
        .scale(2900)
        //offsets the pixel coordinates of the projection's center in the svg container
        //keep these at one - half the svg width and height to keep map centered in container
        .translate([width / 2, height / 2]);

    //holds the path generator
    var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/Cali_Data.csv") //load attributes from csv
        .defer(d3.json, "data/US_States.topojson") //load background spatial data
        .defer(d3.json, "data/Cali_Counties.topojson") //load choropleth spatial data
        .await(callback);

    //callback function
    function callback(error, csvData, us, cali){
        //create graticule generator
        var graticule = d3.geoGraticule()
          .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
        //create graticule background
        var gratBackground = map.append("path")
          .datum(graticule.outline()) //bind graticule background
          .attr("class", "gratBackground") //assign class for styling
          .attr("d", path) //project graticule

        //Example 2.6 creates graticule lines

        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
          .data(graticule.lines()) //bind graticule lines to each element to be created
          .enter() //create an element for each datum
          .append("path") //append each element to the svg as a path element
          .attr("class", "gratLines") //assign class for styling
          .attr("d", path); //project graticule lines
        //translate europe TopoJSON
        var unitedStates = topojson.feature(us, us.objects.US_States), //object from US_States.topojson
            caliCounties = topojson.feature(cali, cali.objects.Cali_Counties).features; //object from Cali_Counties.topojson

        //add usa states to map
        var states = map.append("path")
          .datum(unitedStates)
          .attr("class", function(d){
            return "state "; //creates style for states
          })
          .attr("d", path);

        //add California counties to map
        var counties = map.selectAll(".counties")
          .data(caliCounties)
          .enter()
          .append("path")
          .attr("class", function(d){
            return "county " + d.properties.adm1_code;//creates style for counties
          })
          .attr("d", path);

        //examine the results
        console.log(unitedStates);
        console.log(caliCounties);
        console.log(error);
        console.log(csvData);
        console.log(us);
        console.log(cali);
    };
};
