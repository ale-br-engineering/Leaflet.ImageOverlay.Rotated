
/*
 * 🍂class ImageOverlay.Rotated
 * 🍂inherits ImageOverlay
 *
 * Like `ImageOverlay`, but rotates and skews the image. This is done by using
 * *three* control points instead of *two*.
 *
 * @example
 *
 * ```
 * var topleft    = L.latLng(40.52256691873593, -3.7743186950683594),
 * 	topright   = L.latLng(40.5210255066156, -3.7734764814376835),
 * 	bottomleft = L.latLng(40.52180437272552, -3.7768453359603886);
 *
 * var overlay = L.imageOverlay.rotated("./palacio.jpg", topleft, topright, bottomleft, {
 * 	opacity: 0.4,
 * 	interactive: true,
 * 	attribution: "&copy; <a href='http://www.ign.es'>Instituto Geográfico Nacional de España</a>"
 * });
 * ```
 *
 */

L.ImageOverlay.Rotated = L.ImageOverlay.extend({

	initialize: function (image, topleft, topright, bottomleft, options) {

		if (typeof(image) === 'string') {
			this._url = image;
		} else {
			// Assume that the first parameter is an instance of HTMLImage or HTMLCanvas
			this._rawImage = image;
		}

		this._topLeft    = L.latLng(topleft);
		this._topRight   = L.latLng(topright);
		this._bottomLeft = L.latLng(bottomleft);
		this._bottomRight = L.latLng();

		L.setOptions(this, options);
	},

	initMoveMarker: function(markers, map, iconPath) {

		var iconPath = iconPath || '/assets/leaflet/images/move.png';

		var moveIcon = L.icon({
			iconUrl   : iconPath,
			className : "moveIcon",
			iconSize  : [24, 24],
			iconAnchor: [0, 15]
		});

		// move icon will be always located at the middle between marker 2 et marker 3
		var moveIconCoordinates = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);
		this._moveMarker = L.marker(moveIconCoordinates, {draggable: true, icon: moveIcon}).addTo(map);


		var initialMarkerDiff1X, initialMarkerDiff1Y, initialMarkerDiff2X, initialMarkerDiff2Y, initialMarkerDiff3X, initialMarkerDiff3Y;
		this._moveMarker.on('dragstart', function(ev){

			// When drag starts, try to determine the initial (X, Y) coordinates of each marker from the moveMarker.
			var moveMarkerX = this._map.latLngToLayerPoint(ev.target.getLatLng()).x;
			var moveMarkerY = this._map.latLngToLayerPoint(ev.target.getLatLng()).y;

			var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
			var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
			initialMarkerDiff1X = initialMarker1X - moveMarkerX;
			initialMarkerDiff1Y = initialMarker1Y - moveMarkerY;

			var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
			var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
			initialMarkerDiff2X = initialMarker2X - moveMarkerX;
			initialMarkerDiff2Y = initialMarker2Y - moveMarkerY;

			var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
			var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
			initialMarkerDiff3X = initialMarker3X - moveMarkerX;
			initialMarkerDiff3Y = initialMarker3Y - moveMarkerY;

		});
		this._moveMarker.on('drag', (ev) => {
			
			// During the grad, always adujet the position of the 3 markers to keep the initial offset.
			var targetLatLng = ev.target.getLatLng();
			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

			var newMarker1X = targetLatLngPx + initialMarkerDiff1X;
			var newMarker1Y = targetLatLngPy + initialMarkerDiff1Y;
			var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

			var newMarker2X = targetLatLngPx + initialMarkerDiff2X;
			var newMarker2Y = targetLatLngPy + initialMarkerDiff2Y;
			var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

			var newMarker3X = targetLatLngPx + initialMarkerDiff3X;
			var newMarker3Y = targetLatLngPy + initialMarkerDiff3Y;
			var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

			// Update marker corners location
			markers[1].setLatLng(newMarker1LatLng); 
			markers[2].setLatLng(newMarker2LatLng); 
			markers[3].setLatLng(newMarker3LatLng); 

			this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
		});

	},

	initRotateMarker: function(markers, map, iconPath) {

		var iconPath = iconPath || '/assets/leaflet/images/rotate.png';

		var rotateIcon = L.icon({
			iconUrl: iconPath,
			className: "rotateIcon",
			iconSize  : [24, 24],
			iconAnchor: [0, 15]
		});


		var middleM1M3 = this.middlePoint(markers[1].getLatLng().lat, markers[1].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);
		var rotateIconCoordinates = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, middleM1M3[0], middleM1M3[1])
		this._rotateMarker = L.marker(rotateIconCoordinates, {draggable: true, icon: rotateIcon}).addTo(map);


		var initialMarkerDiff1X, initialMarkerDiff1Y, initialMarkerDiff2X, initialMarkerDiff2Y, initialMarkerDiff3X, initialMarkerDiff3Y;
		var center, centerX, centerY, radWithInitialAngle;

		this._rotateMarker.on('dragstart', (ev) => {
			
			center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

			var targetLatLng = ev.target.getLatLng();
			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

			// get initial marker's distance from image's center
			centerX = this._map.latLngToLayerPoint(center).x;
			centerY = this._map.latLngToLayerPoint(center).y;
			
			var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
			var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
			initialMarkerDiff1X = initialMarker1X - centerX;
			initialMarkerDiff1Y = initialMarker1Y - centerY;

			var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
			var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
			initialMarkerDiff2X = initialMarker2X - centerX;
			initialMarkerDiff2Y = initialMarker2Y - centerY;

			var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
			var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
			initialMarkerDiff3X = initialMarker3X - centerX;
			initialMarkerDiff3Y = initialMarker3Y - centerY;

			// Get initial angle in the plane between the positive x-axis and ray from (0,0) to mouse's position (at first click), in radians
			// https://fr.wikipedia.org/wiki/Atan2
			radWithInitialAngle = Math.atan2(targetLatLngPx - centerX, targetLatLngPy - centerY);

		});

		this._rotateMarker.on('drag', (ev) => {

			var targetLatLng = ev.target.getLatLng();
			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

			// Get the angle in the plane between the positive x-axis and ray from 0,0 (top-left corner of the page) to mouse's position (during drag), in radians
			var rad = Math.atan2(targetLatLngPx - centerX, targetLatLngPy - centerY);

			// Angle value to rotate image
			var rotateAngle = radWithInitialAngle - rad;
			
			// Set new marker's position, using the moveMarker's coordinates at image's center
			var newMarker1X = centerX + (initialMarkerDiff1X*Math.cos(rotateAngle) - initialMarkerDiff1Y*Math.sin(rotateAngle));
			var newMarker1Y = centerY + (initialMarkerDiff1Y*Math.cos(rotateAngle) + initialMarkerDiff1X*Math.sin(rotateAngle));
			var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

			var newMarker2X = centerX + (initialMarkerDiff2X*Math.cos(rotateAngle) - initialMarkerDiff2Y*Math.sin(rotateAngle));
			var newMarker2Y = centerY + (initialMarkerDiff2Y*Math.cos(rotateAngle) + initialMarkerDiff2X*Math.sin(rotateAngle));
			var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

			var newMarker3X = centerX + (initialMarkerDiff3X*Math.cos(rotateAngle) - initialMarkerDiff3Y*Math.sin(rotateAngle));
			var newMarker3Y = centerY + (initialMarkerDiff3Y*Math.cos(rotateAngle) + initialMarkerDiff3X*Math.sin(rotateAngle));
			var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

			// Update marker corners location
			markers[1].setLatLng(newMarker1LatLng); 
			markers[2].setLatLng(newMarker2LatLng); 
			markers[3].setLatLng(newMarker3LatLng); 

			this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)

		});

	},

	initResizeMarker: function(markers, map, iconPath) {

		var iconPath = iconPath || '/assets/leaflet/images/resize.png';

		var resizeIcon = L.icon({
			iconUrl: iconPath,
			className: "resizeIcon",
			iconSize  : [24, 24],
			iconAnchor: [0, 15]
		});

		var resizeIconCoordinates = this.middlePoint(markers[1].getLatLng().lat, markers[1].getLatLng().lng, markers[2].getLatLng().lat, markers[2].getLatLng().lng);
		this._resizeMarker = L.marker(resizeIconCoordinates, {draggable: true, icon: resizeIcon}).addTo(map);

		var initialMarkerDiff1X, initialMarkerDiff1Y, initialMarkerDiff2X, initialMarkerDiff2Y, initialMarkerDiff3X, initialMarkerDiff3Y;
		var centerX, centerY, initialDistToCenter;

		this._resizeMarker.on('dragstart', (ev) => {

			var targetLatLng = ev.target.getLatLng();
			var initialDragX = this._map.latLngToLayerPoint(targetLatLng).x;
			var initialDragY = this._map.latLngToLayerPoint(targetLatLng).y;

			var center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

			// get initial marker's distance from image's center
			centerX = this._map.latLngToLayerPoint(center).x;
			centerY = this._map.latLngToLayerPoint(center).y;

			var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
			var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
			initialMarkerDiff1X = initialMarker1X - centerX;
			initialMarkerDiff1Y = initialMarker1Y - centerY;

			var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
			var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
			initialMarkerDiff2X = initialMarker2X - centerX;
			initialMarkerDiff2Y = initialMarker2Y - centerY;

			var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
			var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
			initialMarkerDiff3X = initialMarker3X - centerX;
			initialMarkerDiff3Y = initialMarker3Y - centerY;

			initialDistToCenter = Math.sqrt((initialDragX-centerX)**2 + (initialDragY-centerY)**2)

		});

		this._resizeMarker.on('drag', (ev) => {

			var targetLatLng = ev.target.getLatLng();
			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

			var distToCenter = Math.sqrt((targetLatLngPx-centerX)**2 + (targetLatLngPy-centerY)**2);
			var ratio = distToCenter/initialDistToCenter;
			
			// Set new marker's position, using the moveMarker's coordinates at image's center
			var newMarker1X = centerX + initialMarkerDiff1X * ratio;
			var newMarker1Y = centerY + initialMarkerDiff1Y * ratio;
			var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

			var newMarker2X = centerX + initialMarkerDiff2X * ratio;
			var newMarker2Y = centerY + initialMarkerDiff2Y * ratio;
			var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

			var newMarker3X = centerX + initialMarkerDiff3X * ratio;
			var newMarker3Y = centerY + initialMarkerDiff3Y * ratio;
			var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

			// Update marker corners location
			markers[1].setLatLng(newMarker1LatLng); 
			markers[2].setLatLng(newMarker2LatLng); 
			markers[3].setLatLng(newMarker3LatLng); 

			this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
		});
	},

	setRotate: function(value) {
		var center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

		// get initial marker's distance from image's center
		var centerX = this._map.latLngToLayerPoint(center).x;
		var centerY = this._map.latLngToLayerPoint(center).y;
			
		var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
		var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
		var initialMarkerDiff1X = initialMarker1X - centerX;
		var initialMarkerDiff1Y = initialMarker1Y - centerY;

		var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
		var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
		var initialMarkerDiff2X = initialMarker2X - centerX;
		var initialMarkerDiff2Y = initialMarker2Y - centerY;

		var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
		var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
		var initialMarkerDiff3X = initialMarker3X - centerX;
		var initialMarkerDiff3Y = initialMarker3Y - centerY;

		// Angle value to rotate image
		var rotateAngle = value * Math.PI / 180;
			
		// Set new marker's position, using the moveMarker's coordinates at image's center
		var newMarker1X = centerX + (initialMarkerDiff1X*Math.cos(rotateAngle) - initialMarkerDiff1Y*Math.sin(rotateAngle));
		var newMarker1Y = centerY + (initialMarkerDiff1Y*Math.cos(rotateAngle) + initialMarkerDiff1X*Math.sin(rotateAngle));
		var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

		var newMarker2X = centerX + (initialMarkerDiff2X*Math.cos(rotateAngle) - initialMarkerDiff2Y*Math.sin(rotateAngle));
		var newMarker2Y = centerY + (initialMarkerDiff2Y*Math.cos(rotateAngle) + initialMarkerDiff2X*Math.sin(rotateAngle));
		var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

		var newMarker3X = centerX + (initialMarkerDiff3X*Math.cos(rotateAngle) - initialMarkerDiff3Y*Math.sin(rotateAngle));
		var newMarker3Y = centerY + (initialMarkerDiff3Y*Math.cos(rotateAngle) + initialMarkerDiff3X*Math.sin(rotateAngle));
		var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

		// Update marker corners location
		markers[1].setLatLng(newMarker1LatLng); 
		markers[2].setLatLng(newMarker2LatLng); 
		markers[3].setLatLng(newMarker3LatLng); 

		this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
	},

	setResize: function(value){
	
		var ratio = value/100;

		var center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

		// get initial marker's distance from image's center
		var centerX = this._map.latLngToLayerPoint(center).x;
		var centerY = this._map.latLngToLayerPoint(center).y;

		var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
		var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
		var initialMarkerDiff1X = initialMarker1X - centerX;
		var initialMarkerDiff1Y = initialMarker1Y - centerY;

		var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
		var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
		var initialMarkerDiff2X = initialMarker2X - centerX;
		var initialMarkerDiff2Y = initialMarker2Y - centerY;

		var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
		var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
		var initialMarkerDiff3X = initialMarker3X - centerX;
		var initialMarkerDiff3Y = initialMarker3Y - centerY;
		
		// Set new marker's position, using the moveMarker's coordinates at image's center
		var newMarker1X = centerX + initialMarkerDiff1X * ratio;
		var newMarker1Y = centerY + initialMarkerDiff1Y * ratio;
		var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

		var newMarker2X = centerX + initialMarkerDiff2X * ratio;
		var newMarker2Y = centerY + initialMarkerDiff2Y * ratio;
		var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

		var newMarker3X = centerX + initialMarkerDiff3X * ratio;
		var newMarker3Y = centerY + initialMarkerDiff3Y * ratio;
		var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

		// Update marker corners location
		markers[1].setLatLng(newMarker1LatLng); 
		markers[2].setLatLng(newMarker2LatLng); 
		markers[3].setLatLng(newMarker3LatLng); 

		this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
	},

	onAdd: function (map) {
		if (!this._image) {
			this._initImage();

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}

		if (this.options.interactive) {
			L.DomUtil.addClass(this._rawImage, 'leaflet-interactive');
			this.addInteractiveTarget(this._rawImage);
		}

		map.on('zoomend resetview', this._reset, this);

		this.getPane().appendChild(this._image);
		this._reset();
	},


    onRemove: function(map) {
        map.off('zoomend resetview', this._reset, this);
        L.ImageOverlay.prototype.onRemove.call(this, map);
    },


	_initImage: function () {
		var img = this._rawImage;
		if (this._url) {
			img = L.DomUtil.create('img');
			img.style.display = 'none';	// Hide while the first transform (zero or one frames) is being done

			if (this.options.crossOrigin) {
				img.crossOrigin = '';
			}

			img.src = this._url;
			this._rawImage = img;
		}
		L.DomUtil.addClass(img, 'leaflet-image-layer');

		// this._image is reused by some of the methods of the parent class and
		// must keep the name, even if it is counter-intuitive.
		var div = this._image = L.DomUtil.create('div',
				'leaflet-image-layer ' + (this._zoomAnimated ? 'leaflet-zoom-animated' : ''));

		this._updateZIndex(); // apply z-index style setting to the div (if defined)
		
		div.appendChild(img);

		div.onselectstart = L.Util.falseFn;
		div.onmousemove = L.Util.falseFn;

		img.onload = function(){
			this._reset();
			img.style.display = 'block';
			this.fire('load');
		}.bind(this);

		img.alt = this.options.alt;
	},


	_reset: function () {
		var div = this._image;

		if (!this._map) {
			return;
		}

		this._map.doubleClickZoom.disable();

		// Project control points to container-pixel coordinates
		var pxTopLeft    = this._map.latLngToLayerPoint(this._topLeft);
		var pxTopRight   = this._map.latLngToLayerPoint(this._topRight);
		var pxBottomLeft = this._map.latLngToLayerPoint(this._bottomLeft);

		// Infer coordinate of bottom right
		var pxBottomRight = pxTopRight.subtract(pxTopLeft).add(pxBottomLeft);
		this._bottomRight = this._map.layerPointToLatLng(L.point(pxBottomRight));

		// pxBounds is mostly for positioning the <div> container
		var pxBounds = L.bounds([pxTopLeft, pxTopRight, pxBottomLeft, pxBottomRight]);
		var size = pxBounds.getSize();
		var pxTopLeftInDiv = pxTopLeft.subtract(pxBounds.min);

		// Calculate the skew angles, both in X and Y
		var vectorX = pxTopRight.subtract(pxTopLeft);
		var vectorY = pxBottomLeft.subtract(pxTopLeft);
		var skewX = Math.atan2( vectorX.y, vectorX.x );
		var skewY = Math.atan2( vectorY.x, vectorY.y );

		// LatLngBounds used for animations
		this._bounds = L.latLngBounds( this._map.layerPointToLatLng(pxBounds.min),
		                               this._map.layerPointToLatLng(pxBounds.max) );

		L.DomUtil.setPosition(div, pxBounds.min);

		div.style.width  = size.x + 'px';
		div.style.height = size.y + 'px';

		var imgW = this._rawImage.width;
		var imgH = this._rawImage.height;
		if (!imgW || !imgH) {
			return;	// Probably because the image hasn't loaded yet.
		}

		var scaleX = pxTopLeft.distanceTo(pxTopRight)   / imgW * Math.cos(skewX);
		var scaleY = pxTopLeft.distanceTo(pxBottomLeft) / imgH * Math.cos(skewY);

		this._rawImage.style.transformOrigin = '0 0';

		this._rawImage.style.transform =
			'translate(' + pxTopLeftInDiv.x + 'px, ' + pxTopLeftInDiv.y + 'px)' +
			'skew(' + skewY + 'rad, ' + skewX + 'rad) ' +
			'scale(' + scaleX + ', ' + scaleY + ') ';
	},

	getGeoJsonMapCoordinates() {
		let geoJson = {
			"type": "MultiPoint",
			"coordinates": [
				[this._topLeft.lng, this._topLeft.lat],
				[this._topRight.lng, this._topRight.lat],
				[this._bottomLeft.lng, this._bottomLeft.lat],
				[this._bottomRight.lng, this._bottomRight.lat],
			]
		};
		console.log("Image GeoJson coordinates : ", geoJson);
		return geoJson;
	},

	reposition: function(topleft, topright, bottomleft) {
		this._topLeft    = L.latLng(topleft);
		this._topRight   = L.latLng(topright);
		this._bottomLeft = L.latLng(bottomleft);
		this._reset();

		// Reposition move marker centered between marker 2 et 3
		if (this._moveMarker) {
			let moveIconCoordinates = this.middlePoint(this._topRight.lat, this._topRight.lng, this._bottomLeft.lat, this._bottomLeft.lng);
			this._moveMarker.setLatLng(moveIconCoordinates);
		}
		if (this._rotateMarker) {
			let middleTop = this.middlePoint(this._topLeft.lat, this._topLeft.lng, this._bottomLeft.lat, this._bottomLeft.lng)
			let rotateIconCoordinates = this.middlePoint(middleTop[0], middleTop[1], this._topRight.lat, this._topRight.lng)
			this._rotateMarker.setLatLng(rotateIconCoordinates); 
		}
		if (this._resizeMarker) {
			let resizeIconCoordinates = this.middlePoint(this._topLeft.lat, this._topLeft.lng, this._topRight.lat, this._topRight.lng)
			this._resizeMarker.setLatLng(resizeIconCoordinates); 
		}
	},

	setUrl: function (url) {
		this._url = url;

		if (this._rawImage) {
			this._rawImage.src = url;
		}
		return this;
	},

	middlePoint: function(lat1, lng1, lat2, lng2) {
		if (typeof (Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function () {
				return this * Math.PI / 180;
			}
		}
		if (typeof (Number.prototype.toDeg) === "undefined") {
			Number.prototype.toDeg = function () {
				return this * (180 / Math.PI);
			}
		}
		var dLng = (lng2 - lng1).toRad();
		lat1 = lat1.toRad();
		lat2 = lat2.toRad();
		lng1 = lng1.toRad();
		var bX = Math.cos(lat2) * Math.cos(dLng);
		var bY = Math.cos(lat2) * Math.sin(dLng);
		var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY));
		var lng3 = lng1 + Math.atan2(bY, Math.cos(lat1) + bX);
		return [lat3.toDeg(), lng3.toDeg()];
	}

});

/* 🍂factory imageOverlay.rotated(imageUrl: String|HTMLImageElement|HTMLCanvasElement, topleft: LatLng, topright: LatLng, bottomleft: LatLng, options?: ImageOverlay options)
 * Instantiates a rotated/skewed image overlay, given the image URL and
 * the `LatLng`s of three of its corners.
 *
 * Alternatively to specifying the URL of the image, an existing instance of `HTMLImageElement`
 * or `HTMLCanvasElement` can be used.
 */
L.imageOverlay.rotated = function(imgSrc, topleft, topright, bottomleft, options) {
	return new L.ImageOverlay.Rotated(imgSrc, topleft, topright, bottomleft, options);
};
