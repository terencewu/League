$(window).load(function() {
	setupMasteries();
	// $('body').click(function(event) {
	// 	console.log("clicked " + event.target.nodeName + " " + event.target.id);
	// });

});

var points = {
	offense : 0,
	defense : 0,
	utility : 0
}

var type = ["offense","defense", "utility"];

function totalPoints() {
	return points["offense"] + points["defense"] + points["utility"];
}

function partSetup(name, masteries) {
	themasteries = masteries;
	for (var i = 0; i < 24; i++) {
		$('#' + name).append('<span class="square-border">' + 
							 ' <div id="' + name + i + '"> </div>' + 
							 '' + 
							 '</span>');
	}

	for (var box = 0; box < 24; box++) {

		//every fourth item represents the end of a row
		var rowCheck = "row" + parseInt((box / 4) + 1);
		var mastery = themasteries[rowCheck][box%4];
		
		if(mastery !== undefined) {
			
			var index = box;
			//if the columns arent right, skip check the next column number (by changing index)
			while(mastery.column != colCheck(index)) {
				index++;		
			}
			var currentDiv = $('#' + name + index);
			currentDiv.addClass("square").css('background-position', getImagePoints(mastery.number - 1,name));
			currentDiv.after('<div id="' + name + index + 'points' +  '"></div>');
			$('#' + name + index + 'points').addClass("points");
			updatePoints(name + index, "0/" + mastery.max_rank);
			// //testing purposes, graying out boxes mean requirement not fulfilled.
			// if(box >= 4){
			// 	currentDiv.addClass("gray");
			// }
			if(mastery.dependent !== undefined) {
				$('#' + name + index + 'points').after('<div class="dependent-bar"> </div>');
				currentDiv.addClass("isDependent");
				$('#' + name + (index - 4)).addClass("hasDependent");
			}
			//mouse detection + action
			//restrict the right click menu popup
			currentDiv.bind("contextmenu",function() { 
				return false;
			}).mousedown(function(event) {
				if(event.which == 1) { // left click
					if(totalPoints() < 30) {
						incrPoints(event.target.id);
					}
				}
				else if(event.which == 3) { //right click
					if(totalPoints() > 0) {
						decrPoints(event.target.id);
					}
				}
			});
		}
	}
}

function pointsNeeded(name, value) {
	var type = name.match(/([a-zA-Z]+)/g, '');
	var index = name.match(/(\d+)/g, '');

	var rowpts = [];
	// the row to remove should have 4 or more points
	// row zero must have at least 4 for the rest to work
	for(var row = 0; row < 6; row++) {
		for(var i = 0; i < 4; i++) {
			var apoint = $('#' + type + i + 'points');
			if(apoint !== undefined) {
				var temp = apoint.text().split("/");
				rowpts[row] += parseInt(temp[0]);
			}
		}
	}
	
	if(value > 0) {//incrementing
		if(parseInt(index/4) == 0) {//first row has no restrictions
			return true;
		}
		else {//second line to sixth
			if(row[0] < 4)
				return false;
			return points[type] >= (parseInt(index/4)) * 4;
		}
	}
	else {
		var max = 0;
		for(var i = 0; i < 24; i++) {
			var temp = $('#' + type + i + 'points');
			if(temp !== undefined)  {
				temp = temp.text().split("/");
				if(temp[0] > 0)
					max = i;
			}
		}
		return ((parseInt(max/4)*4 + 1) < points[type]); //greater than multiple of 4
			
	}
}

// all rows, there must still be points left < 30 to add
// row 1, decrementing must not drop below a multiple of 4 that will break requirements of the other rows
//      , must also not break it's dependency if it has one.

function hasRequired(name, value) {
	return (depSatisfied(name) && pointsNeeded(name, value));
}

function depSatisfied(name) { //value holds -1 or +1
	//for incrementing (check the one above)
	if($('#' + name).hasClass("isDependent")) {
		var newname = name.replace(/(\d+)/g, function(match,replace) {
			return parseInt(replace)-4;
		});
		var pts = $('#' + newname + 'points').text().split("/");
		return pts[0] == pts[1];
	}
	
	//for decrementing (checking the one below has zero pts before decr..)
	else if($('#' + name).hasClass("hasDependent")) {
		var newname = name.replace(/(\d+)/g, function(match,replace) {
			return parseInt(replace)+4;
		});
		var pts = $('#' + newname + 'points').text().split("/");
		//console.log(newname + " IS ZERO");
		return parseInt(pts[0]) === 0;
	}
	return true;
}

function updatePoints(name, text) {
	$('#' + name + 'points').text(text);
}

function calcTotalPoints(name, value) {
	var newname = name.match(/[a-zA-Z]+/);
	points[newname] += value;
	console.log("total : " + totalPoints());
	rowUpdate();
}

function rowUpdate() {// after every 4 pts in a single column, unlock the bottom!

	for(var a = 0; a < type.length; a++) {

		for(var clear = 4; clear < 24; clear++) {
			$('#' + type[a] + clear).addClass("gray");
		}

		for(var i = 1; i < 6; i++) {
			//if over a multiple of 4, ungray!
			if(points[type[a]] >= i * 4) { 
				for(var id = i * 4; id < (i * 4) + 4; id++) {
					var currentDiv = $('#' + type[a] + id);
					
					if(currentDiv.hasClass("isDependent")) {
						var newname = type[a] + (id - 4);
						var pts = $('#' + newname + 'points').text().split("/");
						if(pts[0] == pts[1]) {
							currentDiv.removeClass("gray");
						}
					}
					else {
						if(currentDiv.hasClass("hasDependent")) {
							var newname = type[a] + (id + 4);
							var pts = currentDiv.text().split("/");
							if(pts[0] == pts[1]) {
								$('#' + newname).removeClass("gray");
							}
						}
						currentDiv.removeClass("gray");
					}
				}// for id				
			}// if pts
		}// for i
	}// for offense, defense, utility
}

function decrPoints(name) {
	var strpts = $("#" + name + 'points');
	var pts = strpts.text().split("/");
	if(hasRequired(name, -1) && 0 < pts[0] && pts[0] <= pts[1]) {
		pts[0]--;
		strpts.text(pts[0] + "/" + pts[1]);
		calcTotalPoints(name, -1);
	}
}

function incrPoints(name, type) {
	var strpts = $('#' + name  + 'points');
	var pts = strpts.text().split("/");
	if(hasRequired(name, 1) && 0 <= pts[0] && pts[0] < pts[1]) {
		pts[0]++;
		strpts.text(pts[0] + "/" + pts[1]);
		calcTotalPoints(name, 1);
	}
}

function setupMasteries() {
	var themasteries = getdata("masteries.json");
	// for (var i = 0; i < type.length; i++) {
	// 	partSetup(type[0], themasteries.masteries[type[0]]);
	// }

	partSetup("offense", themasteries.masteries["offense"]);
	partSetup("defense", themasteries.masteries["defense"]);
	partSetup("utility", themasteries.masteries["utility"]);
}

function colCheck(number) {
	var column = parseInt((number + 1) % 4);
	if (column == 0)
		return 4;
	else 
		return column;
}

function getImagePoints(number, name) {

	if(name == "offense") {
		return deciferPosition(number);
	}
	if(name == "defense") {
		return deciferPosition(number + 20);
	}
	if(name == "utility") {
		return deciferPosition(number + 39);
	}
	return "";
}

function deciferPosition(number) { 
	var xPx = (number % 10) * -48;
	var yPx = parseInt(number / 10) * -48;
	return '' + xPx + 'px ' + yPx + 'px';
}

//loads returns a parsed json file
function getdata(filename) {
	if(!filename) return;
	var jsondata = $.ajax({
		type:"GET",
		cache: false,
		url: filename,
		dataType: "json",
		async: false,
	});
	return jQuery.parseJSON(jsondata.responseText);
}



