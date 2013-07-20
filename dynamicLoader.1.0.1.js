/*! dynamicLoader v1.0.1 Copyright (c) 2013 Ugot2BkidNme(Barry A. Rader) license: https://github.com/Ugot2BkidNme/dynamicLoader/blob/master/license.txt */
var dynamicLoader = (function (window, undefined) {
  var
		//check for overwrite
		_dynamicLoader = window.dynamicLoader
		//aliases for better compression
		,document = window.document
		,location = window.location
		,whocalled = arguments.callee
		//for debugging we use console for older browsers this is not an otption so supress it.
		,console = (typeof window.console !== undefined) ? window.console : { log: function(){}, warn: function(){}, error: function(){} }
		//current version
		,version = "1.0.1"
		//display output is false
		,Silent = true
		,ToLoad = {Images: [], StyleSheets:[], Scripts: [] }
		,Loaded = {Images: [], StyleSheets:[], Scripts: [] }
		,UnableToLoad = {Images: [], StyleSheets:[], Scripts: [] }
		,add = function (obj) {
			//add scripts if found
			if (obj.Scripts !== undefined) {
				for (var i = 0; i < obj.Scripts.length; i++) {
					addScript(obj.Scripts[i]);
				}
			}
			//add stylesheets if found
			if (obj.StyleSheets !== undefined) {
				for (var i = 0; i < obj.StyleSheets.length; i++) {
					addStyleSheet(obj.StyleSheets[i]);
				}
			}
			//add images if found
			if (obj.Images !== undefined) {
				for (var i = 0; i < obj.Images.length; i++) {
					addImage(obj.Images[i]);
				}
			}
			return;
		}
		,addScript = function(obj) {
			if (typeof obj === undefined) return false; // don"t really know what to say you gotta send something
			if (typeof obj.name === undefined) {
				console.error("Unable to load stylesheet " + obj.toString() + " because name was not found.");
				return false;
			}
			if (typeof obj.source === undefined) {
				console.error("Unable to load stylesheet " + obj.toString() + " because source was not found.");
				return false;
			}
			if (typeof obj.identifier === undefined) {
				console.error("Unable to load stylesheet " + obj.toString() + " because identifier was not found.");
				return false;
			}
			var toLoad = true;
			for (var i = 0; i < Loaded.Scripts.length; i++) {
				if (Loaded.Scripts[i].name === obj.name) {
					if (!obj.version) break; //no version supplied nothing to do here
					if (!Loaded.Scripts[i].version) break; //well this means our new script has a version but the previously loaded one does not so do nothing for now
					if (!compareVersion(Loaded.Scripts[i], obj)) {
						toLoad = false; //this version or a new version is already loaded. no reason to load again.
						break;
					}
				}
			}
			if (toLoad) { // no point checking if already loaded
				for (var i = 0; i < ToLoad.Scripts.length; i++) {
					if (ToLoad.Scripts[i].name === obj.name) {
						if (!obj.version) break;  //no version supplied nothing to do here
						if (!ToLoad.Scripts[i].version) {
							ToLoad.Scripts.splice(i, 1); //The new library has a version so we will use it over the other version based on supplied information
							break;
						}
						if (compareVersion(ToLoad.Scripts[i], obj)) ToLoad.Scripts.splice(i, 1); //a newer version found lets remove the existing one
					}
				}
			}
			if(toLoad) {
				obj.handled = false; // set default for handling;
				ToLoad.Scripts.push(obj);
			}
		}
		,addStyleSheet = function(obj) {
			if (typeof obj === undefined) return false; // don"t really know what to say you gotta send something
			if (typeof obj.id === undefined) {
				console.error("Unable to load stylesheet " + obj.toString() + " because id was not found.");
				return false;
			}
			if (typeof obj.source === undefined) {
				console.error("Unable to load stylesheet " + obj.toString() + " because source was not found.");
				return false;
			}
			var toLoad = true;
			for (var i = 0; i < Loaded.StyleSheets.length; i++) {
				var toModify = false;
				if (Loaded.StyleSheets[i].id === obj.id) {
					if (obj.version && Loaded.StyleSheets[i].version) {
						if (!compareVersion(Loaded.StyleSheets[i], obj)) {
							toLoad = false; //this version or a new version is already loaded. no reason to load again.
							break;
						}
					}
					if (!obj.media) break; // no point in doing anything to existing stylesheets if not present
					if (!Loaded.StyleSheets[i].media) toModify = true; //always default to the value supplying the most information
					if (obj.media && Loaded.StyleSheets[i].media) {
						if (!compareMedia(Loaded.StyleSheets[i], obj)) {
							toModify = true; //WE need to modify it
							toLoad = false; //we have it already loaded so we have modified the media no reason to load
							break;
						}
					}
					if (toModify) modifyLoadedMedia(Loaded.StyleSheets[i], obj); //something needs to be modified so lets do it
				}
			}
			for (var i = 0; i < ToLoad.StyleSheets.length; i++) {
				if (ToLoad.StyleSheets[i].id === obj.id) {
					if (obj.version && ToLoad.StyleSheets[i].version) {
						if (!compareVersion(Loaded.StyleSheets[i], obj)) {
							toLoad = false; //this version or a new version is already ready to be loaded.
							break;
						}
					}
					if (!obj.media) break; // no point in doing anything to existing stylesheets if not present
					if (!ToLoad.StyleSheets[i].media) toModify = true; //always default to the value supplying the most information
					if (obj.media && ToLoad.StyleSheets[i].media) {
						if (!compareMedia(ToLoad.StyleSheets[i], obj)) {
							toModify = true; //We need to modify it
							toLoad = false; //We are already going to load it no point in readding it
							break;
						}
					}
					if (toModify) ToLoad.StyleSheets[i].media = modifyMediaString(ToLoad.StyleSheets[i].media, obj.media); //something needs to be modified so lets do it
				}
			}
		if (toLoad) {
			obj.handled = false; // set default for handling;
			ToLoad.StyleSheets.push(obj);
		}
	}
		,addImage = function(source) {
			if (typeof source === undefined) return false;
			if (Loaded.Images.indexOf(source) > -1) return false;
			if (ToLoad.Images.indexOf(source) > -1) return false;
			ToLoad.Images.push(source); // add it to be loaded as it was not found;
			return true;
		}
		,compareMedia = function (oldObject, newObject) {
			var oldMedia = [].concat( oldObject.media ); // turn them both into arrays frankly we don"t care if it is or not
			var newMedia = [].concat( newObject.media ); // turn them both into arrays frankly we don"t care if it is or not
			for (var i = 0; i < oldMedia.length; i++) {
				if (oldMedia[i] == "all") return false; // all is the default and covers all so nothing to do here
				for (var j = 0; j < newMedia.length; j++) {
					if (oldMedia[i] == newMedia[j]) {
						oldMedia.splice(i, 1); //remove it as they both exist
						newMedia.splice(i, 1); //remove it as they both exist
						break; // we are done with this loop
					}
				}
			}
			if (newMedia.length > 0) return true; // there is different info available so lets let pass it back
			return false;
		}
		,modifyLoadedMedia = function (oldObject, newObject) {
			var newMedia = "";
			var mySheet = document.getElementById(oldObject.id);
			mySheet.setAttribute("media", modifyMediaString(newObject.media, oldObject.media));
		}
		,modifyMediaString = function (oldString, newString) {
			var oldMedia = [].concat(oldString); // turn them both into arrays frankly we don"t care if it is or not
			var newMedia = [].concat(newString); // turn them both into arrays frankly we don"t care if it is or not
			var combined = []; // new bucket to hold them all
			for (var i = 0; i < oldMedia.length; i++) {
				if (oldMedia[i] === "all") return "all"; // all should always be alone so just pass it
			}
			for (var i = 0; i < newMedia.length; i++) {
				if (newMedia[i] === "all") return "all"; // all should always be alone so just pass it
			}
			for (var i = 0; i < oldMedia.length; i++) {
				for (var j = 0; j < newMedia.length; j++) {
					if (oldMedia[i] == newMedia[j]) {
						combined.push(oldMedia[i]);
						oldMedia.splice(i, 1); //remove it as they both exist
						newMedia.splice(j, 1); //remove it as they both exist
						break; // we are done with this loop
					}
				}
			}
			combined.concat(oldMedia, newMedia); //combine what is left
			return combined.toString(); // return as string
		}
		,compareVersion = function (oldObject, newObject) {
			var oldVersion = parseVersion(oldObject.version);
			var newVersion = parseVersion(newObject.version);
			if (oldVersion.major < newVersion.major) return true;
			if (oldVersion.major > newVersion.major) return false;
			//majors equal continue
			if (oldVersion.minor < newVersion.minor) return true;
			if (oldVersion.minor > newVersion.minor) return false;
			//minors equal continue
			if (oldVersion.patch < newVersion.patch) return true;
			return false;
		}
		,parseVersion = function (string) {
			var string = /(\d+)\.?(\d+)?\.?(\d+)?/.exec(string);
			return { major: parseInt(string[1]) || 0, minor: parseInt(string[2]) || 0, patch: parseInt(string[3]) || 0 }
		}
		,handleRequires = function() {
			var done = [];
			var handling = false; // for recursion
			for (var i = 0; i < ToLoad.Scripts.length; i++) {
				if (ToLoad.Scripts[i].handled) {
					done.push(ToLoad.Scripts[i]);
					continue;
				}//already handled
				if (typeof ToLoad.Scripts[i].requires === undefined || !ToLoad.Scripts[i].requires) {
					ToLoad.Scripts[i].handled = true;
					done.push(ToLoad.Scripts[i]);//no requirements lets put those first on recursion they are already in order
				}
			}
			for (var i = 0; i < ToLoad.Scripts.length; i++) {
				if (ToLoad.Scripts[i].handled) continue; // we already handled these so lets skip them
				var requiredArray = ToLoad.Scripts[i].requires;
				for (var j = 0; j < done.length; j++) {
					for (var k = 0; k < ToLoad.Scripts[i].requires.length; k++) {
						if (ToLoad.Scripts[i].requires[k] === done[j].identifier) { // is it already set to be loaded
							requiredArray.splice(requiredArray.indexOf(done[j].identifier), 1); //remove the requirement
						}
					}
				}
				for (var j = 0; j < Loaded.Scripts.length; j++) {
					for (var k = 0; k < ToLoad.Scripts[i].requires.length; k++) {
						if (ToLoad.Scripts[i].requires[k] === Loaded.Scripts[j].identifier) { //is it already loaded
							requiredArray.splice(requiredArray.indexOf(Loaded.Scripts[j].identifier), 1); //remove the requirement
						}
					}
				}
				if (requiredArray.length > 0) {
					for (var j = 0; j < ToLoad.Scripts[i].requires.length; j++) {
						if ((window.hasOwnProperty && window.hasOwnProperty(ToLoad.Scripts[i].requires[j])) || (Object.prototype.hasOwnProperty.call(window, ToLoad.Scripts[i].requires[j]))) { // lets see if it is already in the dom
							requiredArray.splice(requiredArray.indexOf(ToLoad.Scripts[i].requires[j]), 1); //remove the requirement
						}
					}
				}
				if (requiredArray.length > 0) {
					if (!ToLoad.Scripts[i].attempts) {
						ToLoad.Scripts[i].attempts = 1;
					} else {
						ToLoad.Scripts[i].attempts++;
					}
					//now we check to make sure
					if (ToLoad.Scripts[i].attempts != ToLoad.Scripts.length) handling = true; // we need to do something more. But do not want to continue forever if it has reached the length it obviously isn"t here
				} else {
					ToLoad.Scripts[i].handled = true;
				}
				done.push(ToLoad.Scripts[i]);// put it back in
			}
			ToLoad.Scripts = done; //replace the array with the new array
			if (handling) handleRequires();
			return;
		}
		,handleloadAfter = function() {
			var done = new Array();
			var handling = false; // for recursion
			for (var i = 0; i < ToLoad.StyleSheets.length; i++) {
				if (ToLoad.StyleSheets[i].handled) {
					done.push(ToLoad.StyleSheets[i]);
					continue;
				}//already handled
				if (typeof ToLoad.StyleSheets[i].loadAfter === undefined || !ToLoad.StyleSheets[i].loadAfter) {
					ToLoad.StyleSheets[i].handled = true;
					done.push(ToLoad.StyleSheets[i]);//no requirements lets put those first on recursion they are already in order
				}
			}
			for (var i = 0; i < ToLoad.StyleSheets.length; i++) {
				if (ToLoad.StyleSheets[i].handled) continue; // we already handled these so lets skip them
				var requiredArray = ToLoad.StyleSheets[i].loadAfter;
				for (var j = 0; j < done.length; j++) {
					for (var k = 0; k < ToLoad.StyleSheets[i].loadAfter.length; k++) {
						if (ToLoad.StyleSheets[i].loadAfter[k] === done[j].id) {
							requiredArray.splice(requiredArray.indexOf(done[j].id), 1); //remove the requirement
						}
					}
				}
				for (var j = 0; j < Loaded.StyleSheets.length; j++) {
					for (var k = 0; k < ToLoad.StyleSheets[i].loadAfter.length; k++) {
						if (ToLoad.StyleSheets[i].loadAfter[k] === Loaded.StyleSheets[j].id) { //is it already loaded
							requiredArray.splice(requiredArray.indexOf(Loaded.StyleSheets[j].id), 1); //remove the requirement
						}
					}
				}
				if (requiredArray.length > 0) {
					for (var j = 0; j < ToLoad.StyleSheets[i].loadAfter.length; j++) {
						if (document.getElementById(ToLoad.StyleSheets[i].loadAfter[j])) { // lets see if it is already in the dom
							requiredArray.splice(j, 1); //remove the requirement
							requiredArray.splice(requiredArray.indexOf(ToLoad.StyleSheets[i].loadAfter[j]), 1); //remove the requirement
						}
					}
				}
				if (requiredArray.length > 0) {
					if (!ToLoad.StyleSheets[i].attempts) {
						ToLoad.StyleSheets[i].attempts = 1;
					} else {
						ToLoad.StyleSheets[i].attempts++;
					}
					//now we check to make sure
					if (ToLoad.StyleSheets[i].attempts != ToLoad.StyleSheets.length) handling = true; // we need to do something more. But do not want to continue forever if it has reached the length it obviously isn"t here
				} else {
					ToLoad.StyleSheets[i].handled = true;
				}
				r.push(ToLoad.StyleSheets[i]);// put it back in
			}
			ToLoad.StyleSheets = done; //replace the array with the new array
			if (handling) handleloadAfter();
			return;
		}
		,load = function () {
			handleloadAfter(); // order the stylesheets for loading
			handleRequires(); // order the scripts for loading
			loadNextStylesheet(); // recursivly load the stylesheets
		}
		,loadNextStylesheet = function (increase) {
			increase = typeof increase === undefined ? increase : false;
			if (ToLoad.StyleSheets.length == 0) {
				loadImages(ToLoad.Images); // just load the images
				return; // nothing to do end the function
			}
			if (increase) { ToLoad.StyleSheets[0].counter = ToLoad.StyleSheets[0].counter + 1; }//increase the counter as we are trying the next source
			else { ToLoad.StyleSheets[0].counter = 0; }// well we need to have a counter incase there is a source
			if (!ToLoad.StyleSheets[0].handled) {
				UnableToLoad.StyleSheets.push(ToLoad.StyleSheets[0]);
				if (!Silent) writeToConsole("error", ToLoad.StyleSheets[0].source[ToLoad.StyleSheets[0].counter] + " cannot load as the load before was not loaded!");
				ToLoad.StyleSheets.shift();
				return;
			}
			if (typeof ToLoad.StyleSheets[0].source[ToLoad.StyleSheets[0].counter]  === undefined) { //check if their is another source if not move on
				UnableToLoad.StyleSheets.push(ToLoad.StyleSheets[0]);
				ToLoad.StyleSheets.shift();
				loadNextStylesheet();
				return;
			};
			if (document.getElementById(ToLoad.StyleSheets[0].id)) {
				if (!Silent) writeToConsole("warn", ToLoad.StyleSheets[0].source[ToLoad.StyleSheets[0].counter] + " already loaded!");
				Loaded.StyleSheets.push(ToLoad.StyleSheets[0]);
				ToLoad.StyleSheets.shift();
				loadNextStylesheet();
			} else {
				appendCSS();
			};
		}
		,loadNextScript = function (increase) {
			increase = typeof increase === undefined ? increase : false;
			if (ToLoad.Scripts.length === 0) return; // nothing to do end the function
			if (increase) { ToLoad.Scripts[0].counter = ToLoad.Scripts[0].counter + 1; }//increase the counter as we are trying the next source
			else {ToLoad.Scripts[0].counter = 0; }// well we need to have a counter incase there is a source
			if (!ToLoad.Scripts[0].handled) {
				UnableToLoad.Scripts.push(ToLoad.Scripts[0]);
				if (!Silent) writeToConsole("error", ToLoad.Scripts[0].source[ToLoad.Scripts[0].counter] + " cannot load as requirement not met!");
				ToLoad.Scripts.shift();
				return;
			}
			if (typeof ToLoad.Scripts[0].source[ToLoad.Scripts[0].counter]  === undefined) { //check if their is another source if not move on
				UnableToLoad.Scripts.push(ToLoad.Scripts[0]);
				ToLoad.Scripts.shift();
				loadNextScript();
				return;
			};
			if ((window.hasOwnProperty && window.hasOwnProperty(ToLoad.Scripts[0].identifier)) || (Object.prototype.hasOwnProperty.call(window, ToLoad.Scripts[0].identifier)) || typeof window[ToLoad.Scripts[0].identifier] !== undefined) {
				if (!Silent) writeToConsole("warn",ToLoad.Scripts[0].source[ToLoad.Scripts[0].counter] + " already loaded!");
				Loaded.Scripts.push(ToLoad.Scripts[0]);
				ToLoad.Scripts.shift();
				loadNextScript();
				return;
			} else {
				appendJS();
				return;
			};
		}
		,loadScripts = function() {
			if (typeof arguments === undefined) return false;
			appendJS({"source": arguments});
			return true;
		}
		,loadStyleSheets = function() {
			if (typeof arguments === undefined) return false;
			appendCSS({"source":arguments});
			return true;
		}
		,appendJS = function () {
			var timer = setTimeout(function() {
				timer = null;
				dynamicLoader.loadNextScript();
			}, 1000);
			var body = document.getElementsByTagName("body")[0];
			var script = document.createElement("script");
			script.type = "text/javascript";
			if (script.readyState) {  //IE
				script.onreadystatechange = function() {
					if (script.readyState == "loaded" || script.readyState == "complete") {
						script.onreadystatechange = null;
						if (timer) {
							clearTimeout(timer);
							if (!dynamicLoader.Silent) dynamicLoader.writeToConsole("log", dynamicLoader.ToLoad.Scripts[0].source[dynamicLoader.ToLoad.Scripts[0].counter] + " successfully loaded!");
							dynamicLoader.Loaded.Scripts.push(dynamicLoader.ToLoad.Scripts[0]);
							dynamicLoader.ToLoad.Scripts.shift();
							dynamicLoader.loadNextScript();
						}
					}
				};
			} else script.onload = function() {
				if (timer) {
					clearTimeout(timer);
					if (!dynamicLoader.Silent) dynamicLoader.writeToConsole("log", dynamicLoader.ToLoad.Scripts[0].source[dynamicLoader.ToLoad.Scripts[0].counter] + " successfully loaded!");
					dynamicLoader.Loaded.Scripts.push(dynamicLoader.ToLoad.Scripts[0]);
					dynamicLoader.ToLoad.Scripts.shift();
					dynamicLoader.loadNextScript();
				}
			}; //Others
			script.onAbort = script.onError = function() {
				clearTimeout(timer);
				if (!dynamicLoader.Silent) dynamicLoader.writeToConsole("warn", dynamicLoader.ToLoad.Scripts[0].source[dynamicLoader.ToLoad.Scripts[0].counter] + " not loaded!");
				dynamicLoader.loadNextScript(true);
			};
			script.src = ToLoad.Scripts[0].source[ToLoad.Scripts[0].counter];
			body.appendChild(script);
			return true;
		}
		,appendCSS = function () {
			var timer = setTimeout(function() {
				timer = null;
				dynamicLoader.loadNextScript();
			}, 1000);
			var head = document.getElementsByTagName("head")[0];
			var link = document.createElement("link");
			link.type = "text/css";
			link.rel = "stylesheet";
			if (typeof o.media !== undefined) l.media = o.media;
			if (link.readyState) {  //IE
				link.onreadystatechange = function() {
					if (link.readyState == "loaded" || l.readyState == "complete") {
						link.onreadystatechange = null;
						if (timer) {
							clearTimeout(timer);
							if (!dynamicLoader.Silent) dynamicLoader.writeToConsole("log", dynamicLoader.ToLoad.StyleSheets[0].source[dynamicLoader.ToLoad.StyleSheets[0].counter] + " successfully loaded!");
							dynamicLoader.Loaded.StyleSheets.push(dynamicLoader.ToLoad.StyleSheets[0]);
							dynamicLoader.ToLoad.StyleSheets.shift();
							dynamicLoader.loadNextStylesheet();
						}
					}
				};
			} else link.onload = function() {
				if (timer) {
					clearTimeout(timer);
					if (!dynamicLoader.Silent) dynamicLoader.writeToConsole("log", dynamicLoader.ToLoad.StyleSheets[0].source[dynamicLoader.ToLoad.StyleSheets[0].counter] + " successfully loaded!");
					dynamicLoader.Loaded.StyleSheets.push(dynamicLoader.ToLoad.StyleSheets[0]);
					dynamicLoader.ToLoad.StyleSheets.shift();
					dynamicLoader.loadNextStylesheet();
				}
			}; //Others
			link.onAbort = link.onError = function() {
				clearTimeout(timer);
				if (!dynamicLoader.Silent) dynamicLoader.writeToConsole("warn", dynamicLoader.ToLoad.StyleSheets[0].source[dynamicLoader.ToLoad.StyleSheets[0].counter] + " not loaded!");
				dynamicLoader.loadNextStylesheet(true);
			};
			head.appendChild(link);
			//modifying href after to fix IE
			link.href = ToLoad.StyleSheets[0].source[ToLoad.StyleSheets[0].counter];
			return true;
		}
		,loadImages = function () {
			if (typeof arguments === undefined) {
				loadNextScript();
				return;
			}
			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] == "") continue;
				if (arguments[i] instanceof Array) {
					for (var j = 0; j < arguments[i].length; j++) {
						var img = new Image();
						img.src = arguments[i][j];
						Loaded.Images.push(img);
						if (!Silent) { writeToConsole("log", arguments[i][j] + " successfully loaded!"); };
					}
				} else {
					var img = new Image();
					img.src = arguments[i];
					Loaded.Images.push(img);
					if (!Silent) { writeToConsole("log", arguments[i] + " successfully loaded!"); };
				}
			}
			loadNextScript(); // recursivly load the scripts
		}
		,writeToConsole = function (type, string) {
			console[type](string);
		}
		,setDebugMode = function(mode) {
			if (mode) Silent = false;
			else Silent = true;
		}
	;
	return {
		//expose want we want public to the public
		version: version
		,Silent: Silent
		,console: console
		,ToLoad: ToLoad
		,Loaded: Loaded
		,UnableToLoad: UnableToLoad
		,add: add
		,addScript: addScript
		,addStyleSheet: addStyleSheet
		,addImage: addImage
		,load: load
		,loadNextStylesheet: loadNextStylesheet
		,loadNextScript: loadNextScript
		,loadScripts: loadScripts
		,loadStyleSheets: loadStyleSheets
		,writeToConsole: writeToConsole
		,setDebugMode: setDebugMode
	};
})( window);
