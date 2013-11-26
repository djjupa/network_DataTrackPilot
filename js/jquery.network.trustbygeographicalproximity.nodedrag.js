/*
 * Author:		Julio Angulo
 * Version:		0.01
 * Description: Trust network by geographical proximity
 * 
 * Change from previous version:
 * 		2013-05-29: Including icons on the nested elements
 * 
 */


var w = 1200, //960,
    h = 800,
    maxNodeSize = 50,
    root; 

var vis;
var force = self.force = d3.layout.force()
		.size([w, h]);
var forcepii = d3.layout.force()
		.size([w, h]);

var color = d3.scale.category20();

var radius = 10;
//var nodes, links, defs;
var nestedproperties;


//var TP_ID,
//    fakeTP_ID;

var foundlinks = [];

var latitude = 0,
	longitude = 0,
	privacyconcern = 0;

var latitude_proximity_threshold = 10;     // The threshold for defining a link
var longitude_proximity_threshold = 10;     // The threshold for defining a link
var distance_relationship_threshold = 900000;


$(document).ready(function() {

	//$("#svgdiv").html("<svg id='graph' xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'></svg>");
	$("#svgdiv").html("<svg id='graph' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'></svg>");

	vis = d3.select("svg");

	//d3.csv("../data/trustnetwork_xs.csv", function(testpersons) {
	//d3.csv("../data/trustnetwork_small.csv", function(testpersons) {
	//d3.csv("../data/20130620trustnetwork.csv", function(testpersons) {
	d3.csv("../data/20130701trustnetwork.csv", function(testpersons) {
	//d3.csv("../data/graph.csv", function(testpersons) {
				
		var nodesByID = {};
		
		var testpersonNodes = [];
		
		testpersons.forEach(function(testperson){
			testperson["name"] = testperson.TP_ID;
			testpersonNodes.push(testperson);
			//console.log(testperson);
			
		});
		
		// create a node for each row representing test persons
		testpersonNodes.forEach(createNode);
		
		
		//var links = testpersons;
		var links = findrelationships3(testpersons);
		
		//console.log(links);
		
		links = links.map(function(d) {
			return {
				source: nodesByID[d.source],
				target: nodesByID[d.target],
				value: d.value
			};
			
		});
		
		
		// Extract the array of nodes from the map by name.
		var nodes = d3.values(nodesByID);
		
		// Create the link lines.
		var link = vis.selectAll(".link")
					.data(links)
				.enter().append("line")
                    .attr("class", "link")
                    .style("stroke-width", getweight);
		
		
		var node_drag = d3.behavior.drag()
	        .on("dragstart", dragstart)
	        .on("drag", dragmove)
	        .on("dragend", dragend);
	
	    function dragstart(d, i) {
	        force.stop() // stops the force auto positioning before you start dragging
	    }
	
	    function dragmove(d, i) {
	        d.px += d3.event.dx;
	        d.py += d3.event.dy;
	        d.x += d3.event.dx;
	        d.y += d3.event.dy; 
	        tick(); // this is the key to make it work together with updating both px,py,x,y on d !
	    }
	
	    function dragend(d, i) {
	        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
	        tick();
	        force.resume();
	    }
		
		// Create the node circles.
		var node = vis.selectAll("g.node")
					.data(nodes);
					
					
		var nodeEnter = node.enter().append("svg:g")
					.attr("class", "node")
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
					.call(node_drag)
					;
		
		nodeEnter.append("svg:circle")
					.attr("r", radius)
					.style("stroke", "#fff")
					//.style("fill", function(d) { return color(d.trust_level); })
					.style("fill", setNodeColour)
					.style("stroke", setNodeStroke)
					//.style("stroke-width", function(d) { return d.root ? 0 : 1.5})
					//.style("opacity", function(d) { return d.root ? 0 : 1})
					;
					
					
		// Add text to the node (as defined by the json file) 
		nodeEnter.append("svg:text")
					.attr("class", "nodetext")
					.attr("text-anchor", "middle")
					.attr("dx", function(d) { return radius/2; })
					//.attr("dy", "1.5em")
					.attr("dy", function(d) { return radius/2 + (radius + 5); })
					.text(function(d) { return d.city + ", " + d.country + " (" + d.tp_id + " - " + d.trust_level + ")"; });
		
		
		 // Start the force layout.
		force.nodes(nodes)
			.links(links)
			.on("tick", tick)
			.gravity(0.05)
			.charge(-100)
			.distance(150)
			.linkDistance(120)
			.friction(0.5)
			.start();
		
		// Ticking function
		function tick() {
		    link.attr("x1", function(d) { return d.source.x; })
		        .attr("y1", function(d) { return d.source.y; })
		        .attr("x2", function(d) { return d.target.x; })
		        .attr("y2", function(d) { return d.target.y; });
		    
		    //node.attr("cx", function(d) { return d.x; })
		    //    .attr("cy", function(d) { return d.y; });
			node.attr("transform", function(d) { 
		    	return "translate(" + d.x + "," + d.y + ")"; 
		    });
		}
		
		/**
		 *	Return a node 
		 */
		function createNode(a_node) {
    		return nodesByID[a_node.TP_ID] || (nodesByID[a_node.TP_ID] = {
    															tp_id: a_node.TP_ID, 
    															country: a_node.Country, 
    															city: a_node.City,
    															trust_level: +a_node.TrustLevel,
    															privacy_concern: +a_node.PrivacyConcernScore
    														});
  		}
  		
  		
  		function setNodeColour(d)
		{
			
			//console.log("TRUST LEVEL:");
			//console.log(d.trust_level);
			switch(d.trust_level)
			{
				case 1: 
					return d.color = "006AFF";
					break;
				case 2: 
				    return d.color = "1097EB";
					break;
				case 3:  
				    return d.color = "85CCFF";
					break;
				case 4:  
				    return d.color = "B0F590";
					break;
				case 5:  
				    return d.color = "ECFCCA";
					break;
			}
			
		}
		
		function setNodeStroke(d)
		{
			switch(d.trust_level)
			{
				case 1: 
					return d.color = "78787A";
					break;
				case 2: 
				    return d.color = "78787A";
					break;
				case 3:  
				    return d.color = "78787A";
					break;
				case 4:  
				    return d.color = "78787A";
					break;
				case 5:  
				    return d.color = "78787A";
					break;
			}
			
		}

	});
	
	
	/**
	 * 
	 */
	function findrelationships3(testpersons) {
		
		
		
		var counter = 0;
		
		
		for(var tp=0; tp < testpersons.length; tp++)
		{
			var testperson = testpersons[tp];
			var testpersonCoordinates = new google.maps.LatLng(testperson.Latitude, testperson.Longitude);
				
						
			for(var tpc=tp+1; tpc < testpersons.length; tpc++){
				
				var testperson_compare = testpersons[tpc];
				var testperson_compareCoordinates = new google.maps.LatLng(testperson_compare.Latitude, testperson_compare.Longitude);
				
				// Calculate the distance between two persons using Google's API
				var distanceBetweenTwoPoints = google.maps.geometry.spherical.computeDistanceBetween(testpersonCoordinates, testperson_compareCoordinates);
				
				//console.log("DISTANCE: ");
				//console.log(distanceBetweenTwoPoints);
				
			    // Compare the obtained distance between two persons to a given threshold
				if(	 distanceBetweenTwoPoints < distance_relationship_threshold )
					{	
						
						if(testperson.TP_ID == "NULL000")
						{
							/*
							console.log(testperson.TP_ID);
							console.log(testperson.Longitude);
							console.log(testperson.Latitude);
							console.log(testperson_compare.TP_ID);
							console.log(testperson_compare.Longitude);
							console.log(testperson_compare.Latitude);
							console.log(longitudeDifference);
							console.log(latitudeDifference);
							*/
						}
						addLinkBetweenNodes(testperson, testperson_compare);
					}		
			}
		}
		return foundlinks;
		
	}
	
	
	/**
	 * 
	 */
	function findrelationships2(testpersons) {
		
		
		
		var counter = 0;
		
		
		for(var tp=0; tp < testpersons.length; tp++)
		{
			var testperson = testpersons[tp];
			//console.log(testperson);
			
			for(var tpc=tp+1; tpc < testpersons.length; tpc++){
				
				var testperson_compare = testpersons[tpc];
				//console.log(testperson_compare);
				
				var latitudeDifference = 0;  
				var longitudeDifference = 0;
				
				var testpersonCoordinates = new google.maps.LatLng(testperson.Latitude, testperson.Longitude);
				var testperson_compareCoordinates = new google.maps.LatLng(testperson_compare.Latitude, testperson_compare.Longitude);
				
				var distanceBetweenTwoPoints = google.maps.geometry.spherical.computeDistanceBetween (testpersonCoordinates, testperson_compareCoordinates);
				
				console.log("DISTANCE: ");
				console.log(testperson.Latitude);
				
				console.log(distanceBetweenTwoPoints);
				
				if(isSameLatitude(testperson.Latitude, testperson_compare.Latitude))
				{
					latitudeDifference = Math.abs(Math.abs(+testperson.Latitude) - Math.abs(+testperson_compare.Latitude));
					/*
					console.log(testperson.Country);
					console.log(testperson.Latitude);
					console.log(testperson_compare.Country);
					console.log(testperson_compare.Latitude);
					console.log(latitudeDifference);
					console.log("-----------")
					*/
				}
				else
				{
					latitudeDifference = Math.abs(+testperson.Latitude) + Math.abs(+testperson_compare.Latitude);
				}
				
				if(isSameLongitude(testperson.Longitude, testperson_compare.Longitude))
				{
					longitudeDifference = Math.abs(Math.abs(+testperson.Longitude) - Math.abs(+testperson_compare.Longitude));
				}
				else
				{
					longitudeDifference = Math.abs(+testperson.Longitude) + Math.abs(+testperson_compare.Longitude);
				}
				
				
				if(	 longitudeDifference < longitude_proximity_threshold 
						 && latitudeDifference < latitude_proximity_threshold
						 )
					{	
						
						if(testperson.TP_ID == "NULL000")
						{
							console.log(testperson.TP_ID);
							console.log(testperson.Longitude);
							console.log(testperson.Latitude);
							console.log(testperson_compare.TP_ID);
							console.log(testperson_compare.Longitude);
							console.log(testperson_compare.Latitude);
							console.log(longitudeDifference);
							console.log(latitudeDifference);
						}
						addLinkBetweenNodes(testperson, testperson_compare);
					}		
			}
		}
		return foundlinks;
		
	}
	
	
	function addLinkBetweenNodes(testperson, testperson_compare) {
		var foundlink = {};
		
		foundlink["source"] = testperson.TP_ID;
		foundlink["target"] = testperson_compare.TP_ID;
		foundlink["value"] = 5;
		
		//console.log(foundlink["source"]);
		//console.log(foundlink["target"]);
		//console.log("_______");
		
		foundlinks.push(foundlink);
	}
	
	
	/**
	 * 
	 */
	function isSameLongitude(testpersonLongitude, testperson_compareLongitude) {
		
		if(testpersonLongitude <= 0 && testperson_compareLongitude <= 0)
			return true;
		else if(testpersonLongitude > 0 && testperson_compareLongitude > 0)
			return true;
		else	
			return false;
			
	}
	
	
		/**
	 * 
	 */
	function isSameLatitude(testpersonLatitude, testperson_compareLatitude) {
		
		if(testpersonLatitude <= 0 && testperson_compareLatitude <= 0)
			return true;
			
		else if(testpersonLatitude > 0 && testperson_compareLatitude > 0)
			return true;
		
		else	
			return false;
			
	}
	
	/**
	 * 
	 */
	function getweight(d) {
				return 0.5;
	}


	/**
	 * Gives the coordinates of the border for keeping the nodes inside a frame
	 * http://bl.ocks.org/mbostock/1129492
	 */ 
	function nodeTransform(d) {
	
		d.x =  Math.max(maxNodeSize, Math.min(w - (d.logowidth/2 || 16/2), d.x));
	    d.y =  Math.max(maxNodeSize, Math.min(h - (d.logoheight/2 || 16/2), d.y));
	    return "translate(" + d.x + "," + d.y + ")";
	}
	
	
	
});
