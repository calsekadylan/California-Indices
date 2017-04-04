//__AUTHOR__DylanOsborn__
//making these variables global
var attrArray = ["Percent below poverty line", "percent completed highschool", "Percent black", "Percent asian", "percent hispanic/latino", "percent white"];
var expressed = attrArray[0]; //initial attribute
(function(){
//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap(){


    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 550;
    //map frame dimensions
    // var width = 960,
    //     height = 550;
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
      //place graticule on the map
      setGraticule(map, path);

        //translate europe TopoJSON
        var unitedStates = topojson.feature(us, us.objects.US_States), //object from US_States.topojson
            caliCounties = topojson.feature(cali, cali.objects.Cali_Counties).features; //object from Cali_Counties.topojson

        //var attrArray = ["Percent below poverty line", "percent completed highschool", "Percent black", "Percent asian", "percent hispanic/latino", "percent white"];
        //var expressed = attrArray[0]; //initial attribute
        //add usa states to map
        var states = map.append("path")
          .datum(unitedStates)
          .attr("class", function(d){
            return "state "; //creates style for states
          })
          .attr("d", path);


        var colorScale = makeColorScale(csvData);
        //add enumeration units to the map
        setEnumerationUnits(caliCounties, map, path, colorScale, csvData);

        //add coordinated visualization to the map
        setChart(csvData, colorScale);
      };
}; //end of setMap()

//examine the results
function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
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

};

function joinData(caliCounties, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
    //variables for data join
    //loop through csv to assign each set of csv attribute values to geojson county
    for (var i=0; i<csvData.length; i++){
        var csvCounty = csvData[i]; //the current county
        var csvKey = csvCounty.NAME; //the CSV primary key

        //loop through geojson counties to find correct county
        for (var a=0; a<caliCounties.length; a++){

            var geojsonProps = caliCounties[a].properties; //the current county geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key
            //console.log(csvKey, geojsonKey);
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvCounty[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return caliCounties;
};

function setEnumerationUnits(caliCounties, map, path, colorScale, csvData){
    caliCounties = joinData(caliCounties, csvData)

    //...counties BLOCK FROM MODULE 8
    //var attrArray = ["Percent below poverty line", "percent completed highschool", "Percent black", "Percent asian", "percent hispanic/latino", "percent white"];
    //var expressed = attrArray[0]; //initial attribute
    //add France counties to map
    var counties = map.selectAll(".counties")
        .data(caliCounties)
        .enter()
        .append("path")
        .attr("class", function(d){
          return "county " + d.properties.NAME;//creates style for counties
        })
        .attr("d", path)
        .style("fill", function(d){
          //console.log(d.properties, expressed);
          return colorScale(d.properties[expressed]);
        })
        .style("fill", function(d){
          return choropleth(d.properties, colorScale);

        });
};
//bar graph made the most sense for my data, however if i have more time i would like to try another visualization
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.45,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        //i removed these to fit all my data in the graph
        // chartInnerWidth = chartWidth - leftPadding - rightPadding,
        // chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 35]);

    //set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect") //adds bars to graph
        .sort(function(a, b){
            return b[expressed]-a[expressed] // direction of slope
        })
        .attr("class", function(d){
            return "bars " + d.NAME;
        })
        .attr("width", (chartWidth - leftPadding) / csvData.length - 1) //white space between the bars
        .attr("x", function(d, i){
            return i * ((chartWidth - leftPadding) / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale); //adds the color to graph
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        // brute force for title of attribute (fix me)
        .text("Percent of Population" + expressed.split("ercent")[1]);

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

//function to create color scale generator
function makeColorScale(data){
  //console.log(data);

    var colorClasses = [
        "#fee5d9",
        "#fcbba1",
        "#fc9272",
        "#fb6a4a",
        "#de2d26",
        "#a50f15"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];



    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 6);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

})(); //last line of main.js
