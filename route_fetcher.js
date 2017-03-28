/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

/* Route Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var _ = require('lodash');
var parse = require('json-parse');
var http = require('http');
var convert = require('xml-js');

var RouteFetcher = function(stop_id, token, reloadInterval) {
    console.log('Creating route fetcher for stop id: ' + stop_id);

    var self = this;
    if (reloadInterval < 1000) {
        reloadInterval = 1000;
    }

    var reloadTimer = null;
    this.stop_id = stop_id;
    this.token = token;
    this.debug = false;
    this.depaurtue_times = [];

    var fetchFailedCallback = function() {};
    var itemsReceivedCallback = function() {};


    /* private methods */

    /* scheduleTimer()
     * Schedule the timer for the next update.
     */

    this.scheduleTimer = function() {
        //console.log('Schedule update timer.');
        clearInterval(reloadTimer);
        reloadTimer = setInterval(function() {
            self.fetchRoute();
        }, reloadInterval);
    };

    /* public methods */

    /* setReloadInterval()
     * Update the reload interval, but only if we need to increase the speed.
     *
     * attribute interval number - Interval for the update in milliseconds.
     */
    this.setReloadInterval = function(interval) {
        if (interval > 1000 && interval < reloadInterval) {
            reloadInterval = interval;
        }
    };

    /* broadcastTimes()
     * Broadcast the existing items.
     */
    function broadcastTimes() {
        self.log('Broadcasting ' + self.departure_times.length + ' times.');
        itemsReceivedCallback(self);
    }

    this.onReceive = function(callback) {
        itemsReceivedCallback = callback;
    };

    this.onError = function(callback) {
        fetchFailedCallback = callback;
    };

    this.getStopId = function() {
        return this.stop_id;
    };

    this.getToken = function() {
        return this.token;
    };

    this.setDebug = function(debug) {
        this.debug = debug;
    };

    this.getDepartureTimes = function() {
        self.log('Getting departure_times');
        self.log(self.departure_times);
        return self.departure_times;
    };

    this.log = function(message) {
        if (this.debug) {
            console.log(message);
        }
    };

    this.logError = function(message) {
        if (this.debug) {
            console.error(message);
        }
    };

    this.fetchRoute = function() {
        self.log('Fetching route for stop id ' + this.getStopId());
        var base = 'http://services.my511.org/Transit2.0/';
        var path = 'GetNextDeparturesByStopCode';

        var url = base + path + ".aspx?token=" + this.getToken() + "&stopCode=" + this.getStopId();

        http.get(url, function(response) {
            var rawData = '';

            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                rawData += chunk;
            });
            response.on('end', function() {
                try {
                    var result = convert.xml2json(rawData, {
                        compact: true
                    });
                    self.log(result);
                    var parsed_json = parse([], result);
                    var route_list = parsed_json.RTT.AgencyList.Agency.RouteList.Route;

                    if (!_.isArray(route_list)) {
                        route_list = [route_list];
                    }

                    self.log('Received route list:');
                    self.departure_times = [];
                    _.each(route_list, function(route) {
                        var route_times = route.RouteDirectionList.RouteDirection.StopList.Stop.DepartureTimeList.DepartureTime;
                        if (!_.isArray(route_times)) {
                            route_times = [route_times];
                        }
                        var times = _.map(route_times, function(t) {
                            return parseInt(t._text);
                        });

                        self.departure_times = self.departure_times.concat(times);
                        self.departure_times = _.sortBy(self.departure_times);
                    });
                    self.log('Departure Times:');
                    self.log(self.departure_times);

                    if (self.departure_times.count == 0) {
                        self.log('No routes coming up');
                        return;
                    }
                } catch (e) {
                    console.error('There was an error getting times for stop_id ' + self.getStopId() + ': ' + e.message);
                    self.departure_times = [];
                }

                broadcastTimes();
            });

        }).on('error', function(e) {
            console.error('Got error: ' + e.message);
            callback(false);
        });
    };
};

module.exports = RouteFetcher;
