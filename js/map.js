const MIN_ZOOM_FOR_POINTS = 12;

let fanMarkers = [];
const SERVER_URL = 'https://vmine.xyz/';


const DEFAULT_POINT = {lat: 38.07441984, lng: -97.37389633406};
const DEFAULT_ZOOM = MIN_ZOOM_FOR_POINTS;//5;
const startPoint = getLastPoint();
const startZoom = getLastZoom();
// console.log(startPoint);

const map = L.map('map', { zoomControl: false }).setView([startPoint.lat, startPoint.lng], startZoom);
L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZGV2YW5zaHVsaW51eCIsImEiOiJja3h1MWcybngwcWRyMm5waDlyemoyMHkzIn0.raNjTos02K9cmbKdWLuceA`, {
	attribution: `© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>`,
	id: 'devanshulinux/ckxviyram382z14muuytohhkp',
	minZoom: 4,
	maxZoom: 16,
	tileSize: 512,
	zoomOffset: -1
}).addTo(map);

map.addControl(new L.Control.Search({
	url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
	jsonpParam: 'json_callback',
	propertyName: 'display_name',
	propertyLoc: ['lat','lon'],
	autoCollapse: true,
	textPlaceholder: 'Search location',
	marker: null,
	autoType: false,
	minLength: 2,
	zoom: MIN_ZOOM_FOR_POINTS,
}));



// Rect Draw
let selectLayer;

const editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

const drawOptions = {
	position: 'topleft',
	draw: {
		polyline: false,
		polygon: false,
		circle: false,
		marker: false,
		circlemarker: false,
		rectangle: {
			shapeOptions: {
				clickable: false
			}
		},
		edit: {
			featureGroup: editableLayers,
			remove: false
		}
	}
};
const drawControl = new L.Control.Draw(drawOptions);
map.addControl(drawControl);

document.querySelector('.leaflet-draw-draw-rectangle').setAttribute('title', 'Multi Select');

let rectBounds;
map.on('draw:created', (e) => {
	// console.log(e.layer._bounds);
	rectBounds = e.layer._bounds;

	selectLayer = editableLayers.addLayer(e.layer);
	selectInBounds(e.layer._bounds);
});

let selectedIds = [];
function selectInBounds() {
		if (_scope.pointsLoading) {
			toast('Loading Data', true);
			editableLayers.clearLayers();
			return;
		}

	selectedIds = [];

	for (let i = 0; i < loadedPoints.length; i += 4) {
		if (!inBounds({lat: loadedPoints[i], lng: loadedPoints[i + 1]})) continue;

		selectedIds.push(loadedPoints[i + 2]);
	}

	// clear selection
	setTimeout(() => {
		editableLayers.clearLayers();
	}, 1500);

	if (selectedIds.length == 0) toast('No locations selected', true);
	else dealWithSelected();
}
let toBuyList = [], toInstallList = [];
function dealWithSelected() {
	toBuyList = [];
	toInstallList = [];
	const checkList = {};

	const rating = getRating(selectedIds[0]);

	for (let i = 0; i < selectedIds.length; i++) {
		const id = selectedIds[i];

		if (rating != getRating(id)) {
			toast('Select LAND units with same rating', true);
			return;
		}

		checkList[id] = true;

		if (loadedPointsTypes[id] == 0) toBuyList.push(id);
		else if (_scope.account.lands.indexOf(''+id) >= 0) toInstallList.push(id);
	}

	// fill sl
	_scope.sl.checkList = checkList;
	_scope.sl.selectedIds = selectedIds;
	_scope.sl.toBuyList = toBuyList;
	_scope.sl.totalBuyPrice = (toBuyList.length * _scope.LAND_BASE_PRICES[rating - 1]).toFixed(1);
	_scope.sl.toInstallList = toInstallList;
	_scope.sl.rating = rating;
	_scope.sl.multiMode = 0;
	if (toInstallList.length > toBuyList.length) _scope.sl.multiMode = 1;
	_scope.sl.noRadio = (toInstallList.length < 1 || toBuyList.length < 1);

	_scope.$apply();

	// console.log(`toBuyList = ${toBuyList}`);
	// console.log(`toInstallList = ${toInstallList}`);

	getSelectNames(_scope, selectedIds);

	selectModal.open();
}
// Rect Draw



// setTimeout(() => {
// 	L.grid({
// 		redraw: 'moveend'
// 	}).addTo(map);
// }, 5000);

const fanIcons = {};
for (let i = 2; i <= 10; i++) {
	fanIcons[i] = L.icon({
		iconUrl: `images/fan${i}.gif`,
		iconSize: [60, 60]
	});
}
const squareIcons = {
	small: [
		L.icon({ iconUrl: 'images/level1.png', iconSize: [5, 5] }),
		L.icon({ iconUrl: 'images/level2.png', iconSize: [5, 5] }),
		L.icon({ iconUrl: 'images/level3.png', iconSize: [5, 5] }),
	],
	big: [
		L.icon({ iconUrl: 'images/level1.png', iconSize: [20, 20] }),
		L.icon({ iconUrl: 'images/level2.png', iconSize: [20, 20] }),
		L.icon({ iconUrl: 'images/level3.png', iconSize: [20, 20] }),
	]
};

const FLAG_ICON_SIZE = 40;
const flagIcons = {
	small: [
		L.icon({ iconUrl: 'images/flag1.png', iconSize: [5, 5] }),
		L.icon({ iconUrl: 'images/flag2.png', iconSize: [5, 5] }),
		L.icon({ iconUrl: 'images/flag3.png', iconSize: [5, 5] }),
	],
	big: [
		L.icon({ iconUrl: 'images/flag1.png', iconSize: [FLAG_ICON_SIZE, FLAG_ICON_SIZE] }),
		L.icon({ iconUrl: 'images/flag2.png', iconSize: [FLAG_ICON_SIZE, FLAG_ICON_SIZE] }),
		L.icon({ iconUrl: 'images/flag3.png', iconSize: [FLAG_ICON_SIZE, FLAG_ICON_SIZE] }),
	]
};
const mineIcons = {
	small: [
		L.icon({ iconUrl: 'images/flag1_mine.png', iconSize: [5, 5] }),
		L.icon({ iconUrl: 'images/flag2_mine.png', iconSize: [5, 5] }),
		L.icon({ iconUrl: 'images/flag3_mine.png', iconSize: [5, 5] }),
	],
	big: [
		L.icon({ iconUrl: 'images/mine1.png', iconSize: [FLAG_ICON_SIZE, FLAG_ICON_SIZE] }),
		L.icon({ iconUrl: 'images/mine2.png', iconSize: [FLAG_ICON_SIZE, FLAG_ICON_SIZE] }),
		L.icon({ iconUrl: 'images/mine3.png', iconSize: [FLAG_ICON_SIZE, FLAG_ICON_SIZE] }),
	]
};


map.on('moveend', (e) => {
	loadPoints(map.getBounds(), false);
	setLastPoint(map.getCenter());
	setLastZoom();
});
map.on('zoomend', (e) => {
	// console.log(`Zoom Level = ${map.getZoom()}`);

	loadPoints(map.getBounds(), true);
	setLastPoint(map.getCenter());
	setLastZoom();
});
// map.on('click', async (e) => {
// 	// if (map.getZoom() < 6) return;

// 	const coords = e.latlng;
// 	// console.log(`Clicked ${coords}`);

// 	let lng = Math.round(coords.lng);
// 	let lat = Math.floor(Math.round(coords.lat) / 10);

// 	const prefixLng = lng < 0 ? 'm' : 'p';
// 	lng = Math.abs(lng);

// 	const prefixLat = lat < 0 ? 'm' : 'p';
// 	lat = Math.abs(lat);


// 	const fileName = `${prefixLng}${lng}_${prefixLat}${lat}.json`;
// 	// console.log(`Update ${fileName}`);

// 	const xhttp = new XMLHttpRequest();
// 	xhttp.onreadystatechange = () => {
// 		if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
// 			// console.log(JSON.parse(xhttp.responseText));
			
// 			const display = JSON.parse(xhttp.responseText).display_name;
// 			const country = JSON.parse(xhttp.responseText).address.country;

// 			if (TARGET_COUNTRIES.indexOf(country) < 0) {
// 				console.error(`Not in ${TARGET_COUNTRIES}`);
// 				return;
// 			}

// 			const xhttp2 = new XMLHttpRequest();
// 			xhttp2.open('POST', `${SERVER_URL}save`);
// 			xhttp2.setRequestHeader('Content-Type', 'application/json');
// 			xhttp2.send(JSON.stringify({
// 				fileName,
// 				display,
// 				country,
// 				lat: coords.lat,
// 				lng: coords.lng
// 			}));
		
// 			xhttp2.onreadystatechange = () => {
// 				if (xhttp2.readyState == XMLHttpRequest.DONE && xhttp2.status == 200) {
// 					// console.log(xhttp2.responseText);
// 					loadPoints(map.getBounds());
// 				}
// 			}
// 		}
// 	}
// 	xhttp.open('GET', `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`, true);
// 	xhttp.send();
// });

let loadedPoints = [], loadedPointsTypes = {};
let pendingPointReqs;
let prevBounds = null;
function loadPoints(bounds, forceReload) {
	const lngStartN = Math.floor(bounds._southWest.lng);
	let lngEndN = Math.ceil(bounds._northEast.lng);
	if (lngEndN == 181) lngEndN = 180;
	else if (lngEndN == -181) lngEndN = -180;

	const latStartN = Math.floor(bounds._southWest.lat);
	const latEndN = Math.ceil(bounds._northEast.lat);

	const currBounds = {
		latStartN,
		latEndN,
		lngStartN,
		lngEndN
	};

	// console.log(`CuBo = ${JSON.stringify(currBounds, null, 2)}`);

	if (!forceReload && prevBounds && isObjEqual(currBounds, prevBounds)) return;

	prevBounds = Object.assign({}, currBounds);


	removeFans();
	loadedPoints = [];
	loadedPointsTypes = {};
	pendingPointReqs = 0;

	if (map.getZoom() < MIN_ZOOM_FOR_POINTS) {
		// setInterval(() => {
		// 	if (_scope.pointsLoading == true) {
		// 		_scope.pointsLoading = false;
		// 		_scope.$apply();
		// 	}
		// });
		
		return;
	}

	// console.log(JSON.stringify(bounds, null, 4));

	try {
		_scope.pointsLoading = true;
		_scope.$apply();
	} catch (e) {}

	for (let i = lngStartN; i <= lngEndN; i++) {
		for (let j = latStartN; j <= latEndN; j++) {
			const fileName = `${i < 0 ? 'm' : 'p'}${Math.abs(i)}_${j < 0 ? 'm' : 'p'}${Math.abs(j)}.json`;

			// // console.log(`Load ${fileName}`);
			for (let level = 1; level <= 3; level++) loadPoint(fileName, level);
			pendingPointReqs += 3;
		}
	}

	// // console.log(lngStartN);
	// // console.log(lngEndN);
}
loadPoints(map.getBounds(), false);

function loadPoint(fileName, level) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = async () => {
		if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
			const newPoints = JSON.parse(xhttp.responseText);
			loadedPoints.push(...newPoints);

			// console.log(`${fileName} newPoints = ${newPoints.length}`);

			pendingPointReqs--;
			if (pendingPointReqs == 0) {
				if (loadedPoints.length > 1) {
					const data = await getStatus2(loadedPoints);
					setStatuses(data);
					// console.log(loadedPointsTypes);

					_scope.pointsLoading = false;
					_scope.$apply();
				}

				renderFans();
			}
		}
	}
	xhttp.open('GET', `${SERVER_URL}${level}/${fileName}`, true);
	xhttp.send();
}

function setStatuses(data) {
	// const start = data.lowest;
	// for (let i = 0; i < data.types.length; i++) {
	// 	loadedPointsTypes[start + i] = data.types[i];
	// }
	loadedPointsTypes = data;
}

const MARKER_TYPES = {
	UNCLAIMED: 'Unclaimed Land',
	OWNED: 'Your Land',
	CLAIMED: 'Claimed Land',
	MINING: 'Miner Running'
};
const MARKER_STARS = {
	1: '<i class="material-icons orange-text text-lighten-2">star</i><i class="material-icons grey-text">star</i><i class="material-icons grey-text">star</i>',
	2: '<i class="material-icons grey-text">star</i><i class="material-icons orange-text text-lighten-2">star</i><i class="material-icons orange-text text-lighten-2">star</i>',
	3: '<i class="material-icons orange-text text-lighten-2">star</i><i class="material-icons orange-text text-lighten-2">star</i><i class="material-icons orange-text text-lighten-2">star</i>',
};
function getPopupData(type, rating) {
	return `${type}<br/>${MARKER_STARS[rating]}`;
}

function renderFans() {
	removeFans();
	
	for (let i = 0; i < loadedPoints.length; i += 4) {
		const id = loadedPoints[i + 2];
		const landRating = getRating(id);

		let markerType = MARKER_TYPES.UNCLAIMED;

		let icon = map.getZoom() >= 9 ? squareIcons.big[getRatingIndex(id)] : squareIcons.small[getRatingIndex(id)];
		if (loadedPointsTypes[id] == 1) {
			// owned by user
			if (_scope.account && _scope.account.lands && _scope.account.lands.indexOf(''+id) >= 0) {
				icon = mineIcons.big[getRatingIndex(id)];
				markerType = MARKER_TYPES.OWNED;
			}

			// owned by someone else
			else {
				icon = flagIcons.big[getRatingIndex(id)];
				markerType = MARKER_TYPES.CLAIMED;
			}

			// icon =  _scope.account && _scope.account.lands && _scope.account.lands.indexOf(''+id) >= 0 ? mineIcons.big[getRatingIndex(id)] : flagIcons.big[getRatingIndex(id)];
		}

		// miner installed
		else if (loadedPointsTypes[id] > 1) {
			icon = fanIcons[loadedPointsTypes[id]];
			markerType = MARKER_TYPES.MINING;
		}

		const newMarker = L.marker([loadedPoints[i], loadedPoints[i+1]], { icon }).addTo(map).on('click', () => {
			if (_scope.pointsLoading) return;

			// // console.log(`Clicked = ${id}`);
			// // console.log(`${loadedPoints[i]}, ${loadedPoints[i+1]}`);


			_scope.openLocationModal(id, _scope.account && _scope.account.lands && _scope.account.lands.indexOf(''+id) >= 0, loadedPointsTypes[id]);
			getSimpleAddress(loadedPoints[i], loadedPoints[i+1]);
		});

		// marker popup
		newMarker.bindPopup(getPopupData(markerType, landRating)).openPopup();
		// marker popup

		if (loadedPointsTypes[id] > 1) {
			newMarker._icon.classList.add('fan');
			
			const ratingIndex = getRatingIndex(id);
			if (ratingIndex == 0) newMarker._icon.classList.add('fyellow');
			else if (ratingIndex == 1) newMarker._icon.classList.add('fwhite');
			else newMarker._icon.classList.add('fblue');
		}
		fanMarkers.push(newMarker);
	}
}
function removeFans() {
	fanMarkers.forEach(marker => map.removeLayer(marker));
}

function getSimpleAddress(lat, lng) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = () => {
		if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
			_scope.sl.address = JSON.parse(xhttp.responseText).display_name;
			_scope.$apply();
			// // console.log(JSON.parse(xhttp.responseText).display_name);
			// saveAddress(JSON.parse(xhttp.responseText).display_name);
		}
	}
	xhttp.open('GET', `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, true);
	xhttp.send();
}

function setLastPoint(point) {
	localStorage.setItem('lastPoint', JSON.stringify(point));
}
function getLastPoint() {
	const urlPoint = {
		lat: getParam('lat'),
		lng: getParam('lng')
	};

	if (urlPoint.lat && urlPoint.lng) return urlPoint;

	const data = localStorage.getItem('lastPoint');
	if (data == null) return DEFAULT_POINT;
	else return JSON.parse(data);
}

function setLastZoom() {
	localStorage.setItem('lastZoom', map.getZoom());
}
function getLastZoom() {
	const data = localStorage.getItem('lastZoom');
	if (data == null) return DEFAULT_ZOOM;
	else return data;
}

function isObjEqual(x, y) {
  const ok = Object.keys, tx = typeof x, ty = typeof y;
  return x && y && tx === 'object' && tx === ty ? (
    ok(x).length === ok(y).length &&
      ok(x).every(key => isObjEqual(x[key], y[key]))
  ) : (x === y);
}



function inBounds(point) {
	var eastBound = point.lng < rectBounds._northEast.lng;
	var westBound = point.lng > rectBounds._southWest.lng;
	var inLong;

	if (rectBounds._northEast.lng < rectBounds._southWest.lng) {
		inLong = eastBound || westBound;
	} else {
		inLong = eastBound && westBound;
	}

	var inLat = point.lat > rectBounds._southWest.lat && point.lat < rectBounds._northEast.lat;
	return inLat && inLong;
}


function getParam(paramName) {
	const url = new URL(location.href);
	return url.searchParams.get(paramName);
}