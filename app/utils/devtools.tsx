// TODO: make this a more proper implementation of devtools
export function init() {
	navigator.geolocation.getCurrentPosition = function (success, error) {
		success({
			timestamp: 0,
			coords: {
				accuracy: 0,
				altitude: 0,
				altitudeAccuracy: 0,
				heading: 0,
				speed: 0,
				// London
				latitude: 51.507351,
				longitude: -0.127758,

				// latitude: 6.7952,
				// longitude: 92.5083,
			},
		})
	}

	// @ts-expect-error
	navigator.permissions.query = function (options) {
		return Promise.resolve({ state: 'granted' })
		// return Promise.resolve({ state: 'denied' })
	}
}
