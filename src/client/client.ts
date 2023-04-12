import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const mapId = process.env.MAPID;
const apiKey = process.env.APIKEY == undefined ? "" : process.env.APIKEY;


let threeDMap: any;
let twoDMap: any;

// const pointA = new google.maps.LatLng(48.7099445, 2.1729511);
// const pointB = new google.maps.LatLng(48.7124770, 2.1667032);
// const pointB = new google.maps.LatLng(48.6805805, 2.1723437);

const pointA = new google.maps.LatLng(48.8462, 2.3372);
const pointB = new google.maps.LatLng(48.8469, 2.3461);

const apiOptions = {
	"apiKey": apiKey,
	"version": "beta",
	"map_ids": mapId
};

const mapOptions = {
	"tilt": 0,
	"heading": 0,
	"zoom": 17,
	"center": { lat: pointA.lat(), lng: pointA.lng(), altitude: 120 },
	"mapId": "dca6fc143007e7d4",
	"mapTypeControl": true,
	"mapTypeControlOptions": {
		"mapTypeIds": []
	}
}

async function init3DMap() {
	const mapDiv = document.getElementById("threeDimensionalMap");
	if (mapDiv) {
		const apiLoader = new Loader(apiOptions);
		await apiLoader.load();
		const map = new google.maps.Map(mapDiv, mapOptions);

		// Add a listener to the zoom_changed event of the 2d map
		twoDMap.addListener("zoom_changed", () => {

			const zoom = twoDMap.getZoom();
			if (zoom && zoom >= mapOptions.zoom) {
				map.setZoom(zoom);
			}
		});

		const directionsService = new google.maps.DirectionsService();
		const directionsRenderer = new google.maps.DirectionsRenderer();
		directionsRenderer.setMap(map);
		const directionsRequest = {
			origin: pointA,
			destination: pointB,
			travelMode: google.maps.TravelMode.WALKING
		};
		directionsService.route(directionsRequest, function (result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsRenderer.setDirections(result);
			}
		});
		return map;
	}
}

async function initWebglOverlayView(map: any, circleOverlay: google.maps.OverlayView, circleCenter: google.maps.LatLng | null) {
	let scene: THREE.Object3D<THREE.Event>;
	let renderer: THREE.WebGLRenderer;
	let camera: THREE.Camera;
	let loader: GLTFLoader;

	const webglOverlayView = new google.maps.WebGLOverlayView();

	webglOverlayView.onAdd = () => {

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera();
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
		scene.add(ambientLight);
		const directionLight = new THREE.DirectionalLight(0xffffff, 0.25);
		directionLight.position.set(0.5, -1, 0.5);
		scene.add(directionLight);

		loader = new GLTFLoader();
		const sourceFile = "scene.gltf";
		loader.load(sourceFile, gltf => {
			gltf.scene.scale.set(25, 25, 25);
			gltf.scene.rotation.x = 180 * Math.PI / 180;
			scene.add(gltf.scene);
		});

		const callback = () => {
			const center = threeDMap.getCenter();
			const zoom = threeDMap.getZoom();
			const tilt = threeDMap.getTilt();
			const heading = threeDMap.getHeading();

			circleMap.setCenter(center);
			circleMap.setZoom(zoom);
			circleMap.setTilt(tilt);
			circleMap.setHeading(heading);

			requestAnimationFrame(callback);
		}
		requestAnimationFrame(callback);
	}


	webglOverlayView.onContextRestored = (gl) => {
		renderer = new THREE.WebGLRenderer({
			canvas: gl.gl.canvas,
			context: gl.gl,
			...gl.gl.getContextAttributes()
		});
		renderer.autoClear = false;

		loader.manager.onLoad = () => {
			renderer.setAnimationLoop(() => {
				map.moveCamera({
					tilt: mapOptions.tilt,
					heading: mapOptions.heading,
					zoom: mapOptions.zoom
				})
				if (mapOptions.tilt < 67.5) {
					mapOptions.tilt += 1.0;
				}
				// else if (mapOptions.heading <= 360) {
				// 	mapOptions.heading += 0.2;
				// } 
				else {
					renderer.setAnimationLoop(null);
				}
			})
		}
	}

	webglOverlayView.onDraw = (options: google.maps.WebGLDrawOptions) => {
		const gl = options.gl;

		const matrix = options.transformer.fromLatLngAltitude(mapOptions.center, undefined, undefined);
		camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

		webglOverlayView.requestRedraw();
		renderer.render(scene, camera);
		renderer.resetState();
	};

	const circleDiv = circleOverlay.getPanes()?.overlayMouseTarget;
	const mapDiv = document.createElement("div");
	mapDiv.id = "threeDimensionalMapInCircle1";
	mapDiv.style.width = "0px";
	mapDiv.style.height = "0px";
	circleDiv?.appendChild(mapDiv);

	const circleMap = new google.maps.Map(mapDiv, {
		center: circleCenter,
		zoom: 20,
		mapId: "dca6fc143007e7d4",
		tilt: 0,
		heading: 0,
		gestureHandling: "auto",
		disableDefaultUI: false
	});

	webglOverlayView.setMap(map);

}

function init2DMap() {
	let textDiv: HTMLDivElement;
	const myOptions = {
		zoom: 7,
		center: pointA
	};
	const map = new google.maps.Map(document.getElementById('twoDimensionalMap') as HTMLElement, myOptions);
	twoDMap = map;
	const directionsService = new google.maps.DirectionsService();
	const directionsDisplay = new google.maps.DirectionsRenderer({ map });
	// const markerA = new google.maps.Marker({
	// 	position: pointA,
	// 	// title: "point A",
	// 	// label: "O",
	// 	map: map
	// });
	// const markerB = new google.maps.Marker({
	// 	position: pointB,
	// 	// title: "point B",
	// 	// label: "B",
	// 	map: map
	// });

	calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, pointB);


	const circle = new google.maps.Circle({
		strokeColor: "#FF0000",
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: "blue",
		fillOpacity: 0.35,
		map,
		center: pointA,
		radius: 200,
		clickable: false,
		draggable: false,
		editable: false,
		zIndex: 1
	});

	const circleOverlay = new google.maps.OverlayView();
	circleOverlay.onAdd = async () => {
		const projection = circleOverlay.getProjection();
		const center = projection.fromLatLngToDivPixel(circle.getCenter());
		const centerLatLng = projection.fromDivPixelToLatLng(center);

		if (center) {
			// mapDiv.style.left = `${center.x - 100}px`;
			// mapDiv.style.top = `${center.y - 100}px`;

			init3DMap().then((map) => {
				threeDMap = map;
				initWebglOverlayView(threeDMap, circleOverlay, centerLatLng);
			});
		}
	};

	circleOverlay.draw = () => { };
	circleOverlay.setMap(map);

	// Add listener to the directionsDisplay object
	google.maps.event.addListener(directionsDisplay, 'routeindex_changed', function () {
		var directionsResult = directionsDisplay.getDirections();
		var directionsRoute = directionsResult?.routes[0];
		var bounds = new google.maps.LatLngBounds();
		var route = directionsRoute?.legs[0];
		if (route)
			for (var i = 0; i < route?.steps.length; i++) {
				bounds.extend(route.steps[i].start_location);
				bounds.extend(route.steps[i].end_location);
			}

		google.maps.event.addListener(map, 'mousemove', function (event: { latLng: google.maps.LatLng | google.maps.LatLngLiteral; }) {
			if (bounds.contains(event.latLng)) {
				if (circle) circle.setVisible(true);
				var point = event.latLng;
				if (threeDMap) {
					threeDMap.setCenter(point);
				}

				circle.setCenter(point); // move the circle overlay
				const projection = circleOverlay.getProjection();
				if (projection) {
					const center = projection.fromLatLngToDivPixel(point);
					// if (center) {
					// 	mapDiv.style.left = `${center?.x - 100}px`;
					// 	mapDiv.style.top = `${center.y - 100}px`;
					// }

				}
			} else {
				//hide the circle when outside of the route
				if (circle) circle.setVisible(false);
			}
		});
	});
}


function calculateAndDisplayRoute(directionsService: google.maps.DirectionsService, directionsDisplay: google.maps.DirectionsRenderer, pointA: google.maps.LatLng, pointB: google.maps.LatLng) {
	directionsService.route({
		origin: pointA,
		destination: pointB,
		avoidTolls: true,
		avoidHighways: false,
		travelMode: google.maps.TravelMode.WALKING
	}, function (response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			const path = response?.routes[0].overview_path;
			let result = directionsDisplay.setDirections(response);
			const directionsDiv = document.getElementById("googleMapsDirections");
			if (response && directionsDiv) {
				// Loop through the steps and print the instructions
				const steps = response.routes[0].legs[0].steps;
				for (let i = 0; i < steps.length; i++) {
					console.log(steps[i].instructions);
					directionsDiv.innerHTML += steps[i].instructions + "<br>";
				}
			}
		} else {
			window.alert('Directions request failed due to ' + status);
		}
	});
}

(async () => {
	//threeDMap = await init3DMap();
	//initWebglOverlayView(threeDMap);
	init2DMap();

})();