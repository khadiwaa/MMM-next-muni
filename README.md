# Module: Next Muni
Module for MagicMirror gets next time of next muni train. Allows for multiple routes to be retrieved. Data is retrieved from the 511.org API, provided by the Metropolitan Transportation Commission for the San Francisco Bay Area.

## Install
1. git clone this repo into the directory `modules/nextmuni`
2. run `npm install` inside the `modules/nextmuni` directory
3. Update the configuration with your 511 token and stop IDs, as documented below.

## Config
```
{
        token: "511_TOKEN",
        routes: [
            {
                stop_id: 13915,
                label: "To work"
            },
            {
                stop_id: 16995,
                label: "From work"
            }
        ],
        maxTimesForDisplay: 4,
        animationSpeed: 2 * 1000,
        debug: true
    }
```
* **token**: Get your token for the 511.org API from here: http://511.org/developers/list/tokens/create
* **routes**: Array of routes, with stop_id and label. Get stop ids for routes from here: <https://www.sfmta.com/getting-around/transit/routes-stops>, and the labels will be shown in the module to represent times for each route.
* **maxTimesForDisplay**: times for routes are shown in ascending time of train/bus arrival. This is the max number of times to show per route. (default: 4)
* **animationSpeed**: when times are updated, this is the animation speed at which the updated times are swapped in, in milliseconds. (default: 2 seconds)
* **debug**: used for development. Turns debugging logging on for both the browser and node server.
