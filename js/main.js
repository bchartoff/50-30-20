
var allScenarios, data, dataideal, dataneeds, dataactual;

d3.csv("csv/data.csv", function(csv) {
  // read numerical values as numbers not strings
  csv.forEach(function(d){ d['income'] = +d['income']; });
  csv.forEach(function(d){ d['takehome'] = +d['takehome']; });
  csv.forEach(function(d){ d['housing'] = +d['housing']; });
  csv.forEach(function(d){ d['health'] = +d['health']; });
  csv.forEach(function(d){ d['grocery'] = +d['grocery']; });
  csv.forEach(function(d){ d['transit'] = +d['transit']; });
  csv.forEach(function(d){ d['childcare'] = +d['childcare']; });
  csv.forEach(function(d){ d['fifty'] = +d['fifty']; });
  csv.forEach(function(d){ d['thirty'] = +d['thirty']; });
  csv.forEach(function(d){ d['twenty'] = +d['twenty']; });
  csv.forEach(function(d){ d['population'] = +d['population']; });
  csv.forEach(function(d){ d['difference'] = +d['difference']; });
  data = csv; // pass csv values to the global 'data' object
  allScenarios = csv; // also pass them to this object that -doesn't- get changed in scenario setup

  // get unique values for all three dropdowns and populate them
  getUniques('city');
  getUniques('household');
  getUniques('level');

  setupAndDraw(); // draw the graphs

});

// listen for dropdown selections and update graphs
d3.selectAll('select')
  .on('change', function() {
    data = allScenarios; // reset 'data' to include all scenarios 
    d3.selectAll("svg.graph").remove(); // clear any existing graphs
    setupAndDraw();
});

function setupAndDraw() {
  setScenario(); // get current value of dropdowns and set 'data' to the selected scenario
  setProps(); // set derivative properties
  setupData(); // create a stacked array for each graph

  // draw each graph
  drawIdeal();
  drawNeeds();
  drawActual();
}

function getUniques(dd) {
  var unique = {};
  var distinct = [];
  for (var i in data) {
    if (typeof(unique[data[i][dd]]) == "undefined") {
      distinct.push(data[i][dd]);
    }
    unique[data[i][dd]] = 0;
  }
  $('#' + dd + ' option').each(function() {     // clear dropdown options
    $(this).remove();     
  });
  var option = '';
  for (var i = 0; i < distinct.length; i++) {   // populate dropdown with unique values
    option += '<option value="' + distinct[i] + '">' + distinct[i] + '</option>';
  }
  $('#' + dd).append(option);    
};

function setScenario() {
  var selected = {};
    selected.city = $('select#city option:selected').val();
    selected.household = $('select#household option:selected').val();
    selected.level = $('select#level option:selected').val();
  console.log(selected);
  // select data row based on value
  for (i=0;i<data.length;i++) {
    if (data[i].city == selected.city) {
      console.log(selected.city);
      if (data[i].household == selected.household) 
        data = data[i];   // reduce data object to selected row
    }
  }
};

function setProps() {
  data.difference = data.income - 23850;
  data.fifty = Math.round(data.takehome * 0.5);
  data.thirty = Math.round(data.takehome * 0.3);
  data.twenty = Math.round(data.takehome * 0.2);
  data.needs = data.housing + data.health + data.grocery + data.transit + data.childcare;
  data.lo = data.takehome - data.needs;
  data.lowants = Math.round(data.lo * 0.6);
  data.losaves = Math.round(data.lo * 0.4);
  data.needsperc = Math.round((data.needs / data.takehome)*100);
  data.wantsperc = Math.round((data.lowants / data.takehome)*100);
  data.savesperc = Math.round((data.losaves / data.takehome)*100);
  data.overneeds = Math.round(data.needs - data.fifty);
  data.overneedsperc = (Math.round((data.needsperc - 0.5)*100))/100;
};

function setupData() {

  // setup an array for each graph
  dataideal = [
    [
      { x: 0, y: data.fifty, t1: "50%", t2: "Needs:" }
    ],
    [ 
      { x: 0, y: data.thirty, t1: "30%", t2: "Wants:"  }
    ],
    [
      { x: 0, y: data.twenty, t1: "20%", t2: "Saves:"  }
    ]
  ];

  dataneeds = [
    [
        { x: 0, y: 0 },                          
        { x: 1, y: data.housing },              
        { x: 2, y: data.housing + data.health },               
        { x: 3, y: data.housing + data.health + data.grocery },               
        { x: 4, y: data.housing + data.health + data.grocery + data.transit }   
    ],
    [
        { section: "Housing & Utilities", icon: "housing.svg", x: 0, y: data.housing }, 
        { section: "Healthcare", icon: "health.svg", x: 1, y: data.health }, 
        { section: "Groceries", icon: "grocery.svg", x: 2, y: data.grocery }, 
        { section: "Transportation", icon: "transit.svg", x: 3, y: data.transit },
        { section: "Childcare", icon: "childcare.svg", x: 4, y: data.childcare } 
    ],
    [
        { x: 0, y: data.takehome - data.housing },
        { x: 1, y: data.takehome - data.housing - data.health },
        { x: 2, y: data.takehome - data.housing - data.health - data.grocery },
        { x: 3, y: data.takehome - data.housing - data.health - data.grocery - data.transit },
        { x: 4, y: data.takehome - data.housing - data.health - data.grocery - data.transit - data.childcare }  
    ]
  ];

  dataactual = [
    [
      { x: 0, y: data.needs, t1: data.needsperc, t2: "Needs:" }
    ],
    [ 
      { x: 0, y: data.lowants, t1: data.wantsperc, t2: "Wants:"  }
    ],
    [
      { x: 0, y: data.losaves, t1: data.savesperc, t2: "Saves:"  }
    ]
  ];

  // stack each array
  var stack = d3.layout.stack();
  stack(dataideal);
  stack(dataactual);
  stack(dataneeds);
};



// set global dimenions
var w = d3.select("div.row").node().getBoundingClientRect().width - 30;  // global width - pull from foundation row width
var h;

// select first in a series - useful for appending lines
d3.selection.prototype.first = function() {     
  return d3.select(this[0][0]);
};

// move selection to front
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

// move selection to back
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

// DRAW IDEAL BUDGET GRAPH
function drawIdeal() {

  var dataset = dataideal; 
  var h = 100; 
  var lineHeight = 220;  // height of solid lines

  // set up scales 
  var xScale = d3.scale.ordinal()      // actually y scale, since we're doing horizontal bars
    .domain(d3.range(dataset[0].length))
    .rangeRoundBands([0, h]);

  var yScale = d3.scale.linear()       // actually x scale
    .domain([0,       
      d3.max(dataset, function(d) {
        return d3.max(d, function(d) {
          return d.y0 + d.y;
        });
      })
    ])
    .range([0, w]);
  
  // create SVG element
  var svg = d3.select("#graph-ideal")
        .append("svg")
        .attr("class", "graph")
        .attr("width", w)        
        .attr("height", h+120);   // +120 is to open up vertical space for annotation

  // add a group for each row of data
  var groups = svg.selectAll("g")
    .data(dataset)
    .enter().append("g")
    .style("fill", function(d, i) {                  
      var fillColor;                                  
        if (i == 0) { fillColor = "#f8bc50";}         // yellow
        else if (i == 1) { fillColor = "#c66728";}    // orange
        else if (i == 2) { fillColor = "#ab4949";}    // red
      return fillColor;      
    });

  // add a rect for each data value
  var rects = groups.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("x", function(d) { return yScale(d.y0); }) 
      .attr("y", 128)   // 128 is to shift chart down to make way for annotation
      .attr("width", function(d) { return yScale(d.y); })
      .attr("height", xScale.rangeBand());

  // draw a line over the start of each rect
  var lines = groups.selectAll("line")
    .data(function(d) { return d; })
    .enter().append("line")
    .attr("y1", 0) 
    .attr("y2", lineHeight) 
    .attr("x1", function(d) { return yScale(d.y0); }) 
    .attr("x2", function(d) { return yScale(d.y0); })        
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none");

  // add the last line at the end of the graph
  svg.append("line") 
    .attr("y1", 0) 
    .attr("y2", lineHeight) 
    .attr("x1", w-2)
    .attr("x2", w-2) 
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none");

  // fix the position of the first line of the graph
  var lineFix = svg.selectAll('line'); 
  lineFix.first()
    .attr('transform', 'translate(2,0)');

  // add label line 1
  var textLabelOne = svg.selectAll() // TODO: need to separate bold and regular text via tspans
    .data(dataset)
    .enter().append("text")
    .attr("class", "graph-label")
    .style("font-weight", 700)
    .attr("fill", "#231f20")
    .attr("dx", function(d) { return yScale(d[0].y0)+10; })  // position horizontally
    .attr("dy", "60")                                        // position vertically -- TODO: base these on type size?
    .text(function(d) { return d[0].t1; });

  var textLabelOneAyy = d3.selectAll(".graph-label")
    .append("tspan")
    .style("font-weight", 400)
    .text(function(d) { return " " + d[0].t2 })

  // add label line 2
  var textLabelTwo = svg.selectAll()
    .data(dataset)
    .enter().append("text")
    .attr("class", "graph-label")
    .attr("fill", "#231f20")
    .attr("dx", function(d) { return yScale(d[0].y0)+10; })  // position horizontally
    .attr("dy", "100")                                       // position vertically -- TODO: base these on type size?
    .text(function(d) { return "$" + d[0].y; });
}

// DRAW NEEDS GRAPH 
function drawNeeds() {

  var h = 720; 
  var dataset = dataneeds;
  var bottomOffset = 34;

  // reset scales 
  var xScale = d3.scale.ordinal()              
    .domain(d3.range(dataset[0].length))
    .rangeRoundBands([0, h]); 

  var yScale = d3.scale.linear()               
    .domain([0,
      d3.max(dataset, function(d) {
        return d3.max(d, function(d) {
          return d.y0 + d.y;
        });
      })
    ])
    .range([0, w]); 

  // create new svg element
  var svg = d3.select("#graph-needs")
    .append("svg")
    .attr("class", "graph")
    .attr("width", w)
    .attr("height", h);    

  // add background colors
  svg.append("rect")
    .attr("x", 0) 
    .attr("y", 0) 
    .attr("width", function(d) { return yScale(data.fifty); })
    .attr("height", h-bottomOffset)
    .style("fill", "#f8bc50")
    .style("fill-opacity", 0.18);

  svg.append("rect")
    .attr("x", function(d) { return yScale(data.fifty); }) 
    .attr("y", 0) 
    .attr("width", function(d) { return yScale(data.thirty); })
    .attr("height", h-bottomOffset)
    .style("fill", "#c66728")
    .style("fill-opacity", 0.18);

  svg.append("rect")
    .attr("x", function(d) { return yScale(data.fifty) + yScale(data.thirty); }) 
    .attr("y", 0) 
    .attr("width", function(d) { return yScale(data.twenty); })
    .attr("height", h-bottomOffset)
    .style("fill", "#ab4949")
    .style("fill-opacity", 0.18);

  // add a group for each row of data
  var groups = svg.selectAll("g")
    .data(dataset)
    .enter().append("g")
    .style("fill", function(d, i) {                   
      var fillColor;                                  
        if (i == 0) { fillColor = "#f8bc50" ;}         // solid yellow
        else if (i == 1) { fillColor = "url(#diagonal-stripe-2)" ;}    // pattern fill defined in svg in html
        else if (i == 2) { fillColor = "#e8e8e8" ;}    // gray
      return fillColor;      
    });

  // add a rect for each data value
  var rects = groups.selectAll("rect")
    .data(function(d) {return d;})
    .enter().append("rect")
    .attr("x", function(d) { return yScale(d.y0); })
    .attr("y", function(d, i) { return xScale(i)+50; })   // value adjusts vertical position of rects
    .attr("width", function(d) { return yScale(d.y); })
    .attr("height", 60);                                  // value sets height of each bar, no effect on position

  // first dashed line
  svg.append("line")
    .attr("y1", h-bottomOffset) 
    .attr("y2", 0) 
    .attr("x1", 2) 
    .attr("x2", 2) 
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // second dashed line - 50% of ideal budget
  svg.append("line")
    .attr("y1", h-bottomOffset) 
    .attr("y2", 0) 
    .attr("x1", function(d) { return yScale(data.fifty); })
    .attr("x2", function(d) { return yScale(data.fifty); })
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // third dashed line - next 30% of ideal budget
  svg.append("line")
    .attr("y1", h-bottomOffset) 
    .attr("y2", 0) 
    .attr("x1", function(d) { return yScale(data.fifty) + yScale(data.thirty); })
    .attr("x2", function(d) { return yScale(data.fifty) + yScale(data.thirty); })
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // fourth dashed line
  svg.append("line")
    .attr("y1", h-bottomOffset) 
    .attr("y2", 0) 
    .attr("x1", w-2)
    .attr("x2", w-2)
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // add a label to each row, indicating which value (housing, healthcare etc.) is being added to the cumulative total
  var textLabelOne = svg.selectAll("text")
    .data(dataset[1])
    .enter().append("text")
    .attr("y", function(d, i) { return xScale(i)+35; })     // value adjusts vertical position of labels
    .attr("x", function(d) { return yScale(d.y0)+32; })      // value adjusts horizontal position of labels
    .attr("fill", "#231f20")
    .attr("class", "needs-label")
    .text(function(d) { 
      if (d.section != null) { return d.section; } // only add label if 'section' exists in the object
      else { return null; }                                      // TODO: destroy the text element instead of return null
    })                                                           // also: maybe don't need this conditional anymore?

  var textLabelTwo = d3.selectAll(".needs-label")
    .append("tspan")
    .style("font-weight", 700)
    .text(function(d) { return " +$" + d.y })

  // add svg icons to text labels
  var icons = svg.selectAll("svg") 
    .data(dataset[1])                     // this now targets the second array in dataset, where caption info is stored
    .enter().append("svg:image")
    .attr("xlink:href", function(d) {
      if(d.icon != null) {                // TODO: probably don't need this conditional anymore
        return "img/" + d.icon; }
      else { return null; }
    })
    .attr("y", function(d, i) { return xScale(i)+16; })     
    .attr("x", function(d) { return yScale(d.y0)+6; })
    .attr("width", 20)      
    .attr("height", 20);

  // add below-the-bar icons 
  var subIcons = svg.selectAll("svg")
    .data(dataset[1])
    .enter().append("svg:image")    // first add one icon of each type
    .attr("class", "subicon")
    .attr("xlink:href", function(d) {
      if(d.icon != null) {
        return "img/grey-" + d.icon; }
      else { return null; }
    })
    .attr("y", function(d, i) { return xScale(i)+116; })                // vertical position below the relevant bar
    .attr("x", function(d) { return yScale(d.y0)+(yScale(d.y)/2)-10; }) // horizontal position in the middle of the relevant bar
    .attr("width", 20)      
    .attr("height", 20)
    .each(function(d,i) {           // then add a corresponding icon for each remaining bar
      for (n=i; n<4; n++) {
        svg.selectAll("svg")
          .data([d])
          .enter().append("svg:image")
          .attr("class", "subicon")
          .attr("xlink:href", "img/grey-" + d.icon)
          .attr("y", function(d, i) { return xScale(i)+260+(n*144); })  // vert - 260 is 116 + 144 (height of bar etc.)
          .attr("x", function(d) { return yScale(d.y0)+(yScale(d.y)/2)-10; }) // horz - same as above
          .attr("width", 20)      
          .attr("height", 20);
      }
    });
}

// DRAW ACTUAL BUDGET GRAPH
function drawActual() {

  var dataset = dataactual;
  var h = 100; 
  var barOffset = 160;

  // reset scales 
  var xScale = d3.scale.ordinal()
    .domain(d3.range(dataset[0].length))
    .rangeRoundBands([0, h]);

  var yScale = d3.scale.linear()
    .domain([0,       
      d3.max(dataset, function(d) {
        return d3.max(d, function(d) {
          return d.y0 + d.y;
        });
      })
    ])
    .range([0, w]);

  // create SVG element
  var svg = d3.select("#graph-actual")
        .append("svg")
        .attr("class", "graph ok")
        .attr("width", w)         
        .attr("height", h+240);   // +240 opens up vertical space for annotation

  // add a group for each row of data
  var groups = svg.selectAll("g")
    .data(dataset)
    .enter().append("g")
    .style("fill", function(d, i) {                   
      var fillColor;                                  
        if (i == 0) { fillColor = "#f8bc50";}         // yellow
        else if (i == 1) { fillColor = "#c66728";}    // orange
        else if (i == 2) { fillColor = "#ab4949";}    // red
      return fillColor;      
    });

  // add a rect for each data value
  var rects = groups.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("x", function(d) { return yScale(d.y0); })
      .attr("y", barOffset)    // set vertical position of bar inside svg
      .attr("class", "actual-rect")    // set vertical position of bar inside svg
      .attr("width", function(d) { return yScale(d.y); })
      .attr("height", xScale.rangeBand());


  // draw a line over the start of every rect
  var lines = groups.selectAll("line")
    .data(function(d) { return d; })
    .enter().append("line")
    .attr("x1", function(d) { return yScale(d.y0); }) 
    .attr("x2", function(d) { return yScale(d.y0); })        
    .attr("y1", barOffset)  // top of line
    .attr("y2", barOffset+h)  
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none");

  // fix the position of the first line of the graph
  var lineFix = svg.selectAll('line'); 
  lineFix.first()
    .attr('transform', 'translate(2,0)');

  // add the last line at the end of the graph
  svg.append("line")
    .attr("x1", w-2) 
    .attr("x2", w-2) 
    .attr("y1", barOffset) 
    .attr("y2", barOffset+h) 
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none");

  var dashedHeight = 80;

  // add dashed lines
  svg.append("line")
    .attr("y1", barOffset-60)   // 60 extends dashed line above bar
    .attr("y2", barOffset+140) // 240 extends dashed line to bottom of svg
    .attr("x1", 2) 
    .attr("x2", 2) 
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // second dashed line
  svg.append("line")
    .attr("y1", barOffset-60)   // 60 extends dashed line above bar
    .attr("y2", barOffset+140) // 240 extends dashed line to bottom of svg
    .attr("x1", function(d) { return yScale(data.fifty); })
    .attr("x2", function(d) { return yScale(data.fifty); })
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // third dashed line
  svg.append("line")
    .attr("y1", barOffset-60)   // 60 extends dashed line above bar
    .attr("y2", barOffset+140) // 240 extends dashed line to bottom of svg
    .attr("x1", function(d) { return yScale(data.fifty) + yScale(data.thirty); })
    .attr("x2", function(d) { return yScale(data.fifty) + yScale(data.thirty); })
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // fourth dashed line
  svg.append("line")
    .attr("y1", barOffset-60)   // 60 extends dashed line above bar
    .attr("y2", barOffset+140) // 240 extends dashed line to bottom of svg
    .attr("x1", w-2)
    .attr("x2", w-2)
    .style("stroke-width", 4)
    .style("stroke", "white")
    .style("fill", "none")
    .style("stroke-dasharray", ("4, 8"));

  // add label line 1
  var textLabelOne = groups.selectAll("text") // TODO: need to separate bold and reg trext via tspans
    .data(function(d) { return d; })
    .enter().append("text")
      .attr("class", "actual-label")
      .style("font-weight", 700)
      .attr("fill", "#231f20")
      .attr("dx", function(d) { return yScale(d.y0)+10; })    // position horizontally
      .attr("dy", barOffset - 60)                             // position vertically
      .text(function(d) { return d.t1; });

  var textLabelTwo = d3.selectAll(".actual-label")
    .append("tspan")
    .style("font-weight", 400)
    .text(function(d) { return "% " + d.t2 });

  // add label line 2
  var textLabelThree = d3.selectAll(".actual-label")
    .append("tspan")
    .attr("class", "labelThree")
    .attr("x", function(d) { return yScale(d.y0)+10; })
    .attr("dy", 36)
    .style("font-weight", 400)
    .text(function(d) { return "$" + d.y });

  arrangeLabels();

}

// re-arrange labels to prevent overlap
function arrangeLabels() {

  var secondLabel = document.getElementsByClassName("actual-label")[1];
  var thirdLabel = document.getElementsByClassName("actual-label")[2];
  var secondLabelThirdLine = document.getElementsByClassName("labelThree")[1];
  var thirdLabelThirdLine = document.getElementsByClassName("labelThree")[2];

  var a = secondLabel.getBoundingClientRect();
  var b = thirdLabel.getBoundingClientRect();

  var secondX = d3.select(secondLabel).attr("dx");
  var secondY = d3.select(secondLabel).attr("dy");
  var secondThirdX = d3.select(secondLabelThirdLine).attr("x");

  var thirdX = d3.select(thirdLabel).attr("dx");
  var thirdY = d3.select(thirdLabel).attr("dy");
  var thirdThirdX = d3.select(thirdLabelThirdLine).attr("x");

  // detect overlap between second and third labels
  if((Math.abs(a.left - b.left) * 2 < (a.width + b.width)) && 
     (Math.abs(a.top - b.top) * 2 < (a.height + b.height))) { 

    d3.select(secondLabel)
      .attr("dx", secondX-208)
      .attr("dy", secondY-36);
    d3.select(secondLabelThirdLine)
      .attr("x", secondThirdX-208);

    d3.select(thirdLabel)
      .attr("dx", thirdX-104)
      .attr("dy", thirdY-72);
    d3.select(thirdLabelThirdLine)
      .attr("x", thirdThirdX-104);

    var thisLabel = secondLabel.getBBox();
    var thisRect = document.getElementsByClassName('actual-rect')[1].getBBox();
    var tspanWidth = document.getElementsByClassName('labelThree')[1].getComputedTextLength();

    // draw lines from 2nd label
    d3.select("svg.ok") // horizontal
      .append("line")
      .attr("x1", thisLabel.x + tspanWidth+10) 
      .attr("y1", 90)
      .attr("x2", thisRect.x + (thisRect.width / 2) + 2 ) 
      .attr("y2", 90) 
      .style("stroke-width", 4)
      .style("stroke", "#231f20")
      .style("fill", "none");

    d3.select("svg.ok") // vertical
      .append("line")
      .attr("x1", thisRect.x + (thisRect.width / 2) ) 
      .attr("y1", 90)
      .attr("x2", thisRect.x + (thisRect.width / 2) ) 
      .attr("y2", 140) 
      .style("stroke-width", 4)
      .style("stroke", "#231f20")
      .style("fill", "none");

    var thisLabel = thirdLabel.getBBox();
    var thisRect = document.getElementsByClassName('actual-rect')[2].getBBox();
    var tspanWidth = document.getElementsByClassName('labelThree')[2].getComputedTextLength();

    // draw lines from 2nd label
    d3.select("svg.ok") // horizontal
      .append("line")
      .attr("x1", thisLabel.x + tspanWidth+10) 
      .attr("y1", 54)
      .attr("x2", thisRect.x + (thisRect.width / 2) + 2 ) 
      .attr("y2", 54) 
      .style("stroke-width", 4)
      .style("stroke", "#231f20")
      .style("fill", "none");

    d3.select("svg.ok") // vertical
      .append("line")
      .attr("x1", thisRect.x + (thisRect.width / 2) ) 
      .attr("y1", 54)
      .attr("x2", thisRect.x + (thisRect.width / 2) ) 
      .attr("y2", 140) 
      .style("stroke-width", 4)
      .style("stroke", "#231f20")
      .style("fill", "none");
  }
}
