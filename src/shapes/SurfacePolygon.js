/*
 * Copyright 2015-2017 WorldWind Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @exports SurfacePolygon
 */
define([
        '../error/ArgumentError',
        '../util/Logger',
        '../shapes/ShapeAttributes',
        '../shapes/SurfaceShape'
    ],
    function (ArgumentError,
              Logger,
              ShapeAttributes,
              SurfaceShape) {
        "use strict";

        /**
         * Constructs a surface polygon.
         * @alias SurfacePolygon
         * @constructor
         * @augments SurfaceShape
         * @classdesc Represents a polygon draped over the terrain surface. The polygon may have multiple boundaries in
         * order to define holes or empty regions.
         * <p>
         * SurfacePolygon uses the following attributes from its associated shape attributes bundle:
         * <ul>
         *         <li>Draw interior</li>
         *         <li>Draw outline</li>
         *         <li>Interior color</li>
         *         <li>Outline color</li>
         *         <li>Outline width</li>
         *         <li>Outline stipple factor</li>
         *         <li>Outline stipple pattern</li>
         * </ul>
         * @param {Array} boundaries The polygons boundary locations. If this argument is an array of
         * [Locations]{@link Location} they define this polygon's outer boundary. If it is an array of arrays of
         * Locations then each array entry defines one of this polygon's boundaries.
         * @param {ShapeAttributes} attributes The attributes to apply to this shape. May be null, in which case
         * attributes must be set directly before the shape is drawn.
         *
         * @throws {ArgumentError} If the specified boundaries are null or undefined.
         */
        var SurfacePolygon = function (boundaries, attributes) {
            if (!Array.isArray(boundaries)) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "SurfacePolygon", "constructor",
                        "The specified boundary is not an array."));
            }

            SurfaceShape.call(this, attributes);

            this._boundaries = boundaries;

            this._stateId = SurfacePolygon.stateId++;
        };

        SurfacePolygon.prototype = Object.create(SurfaceShape.prototype);

        Object.defineProperties(SurfacePolygon.prototype, {
            /**
             * This polygon's boundaries. The polygons boundary locations. If this argument is an array of
             * [Locations]{@link Location} they define this polygon's outer boundary. If it is an array of arrays of
             * Locations then each array entry defines one of this polygon's boundaries.
             * @type {Location[][] | Location[]}
             * @memberof SurfacePolygon.prototype
             */
            boundaries: {
                get: function () {
                    return this._boundaries;
                },
                set: function (boundaries) {
                    if (!Array.isArray(boundaries)) {
                        throw new ArgumentError(
                            Logger.logMessage(Logger.LEVEL_SEVERE, "SurfacePolygon", "set boundaries",
                                "The specified value is not an array."));
                    }
                    this.resetBoundaries();
                    this._boundaries = boundaries;
                    this._stateId = SurfacePolygon.stateId++;
                    this.stateKeyInvalid = true;
                }
            }
        });

        // Internal use only. Intentionally not documented.
        SurfacePolygon.stateId = Number.MIN_SAFE_INTEGER;

        // Internal use only. Intentionally not documented.
        SurfacePolygon.staticStateKey = function (shape) {
            var shapeStateKey = SurfaceShape.staticStateKey(shape);

            return shapeStateKey +
                " pg " + shape._stateId;
        };

        // Internal use only. Intentionally not documented.
        SurfacePolygon.prototype.computeStateKey = function () {
            return SurfacePolygon.staticStateKey(this);
        };

        // Internal. Polygon doesn't generate its own boundaries. See SurfaceShape.prototype.computeBoundaries.
        SurfacePolygon.prototype.computeBoundaries = function(dc) {
        };

        // Internal use only. Intentionally not documented.
        SurfacePolygon.prototype.getReferencePosition = function () {
            // Assign the first position as the reference position.
            if(this.boundaries.length > 0 && this.boundaries[0].length > 2){
                return this.boundaries[0][0];
            }
            else if (this.boundaries.length > 2){
                return this.boundaries[0];
            }
            else {
                return null;
            }
        };

        // Internal use only. Intentionally not documented.
        SurfacePolygon.prototype.moveTo = function (oldReferenceLocation, newReferenceLocation) {
            if(this.boundaries.length > 0 && this.boundaries[0].length > 2){
                var boundaries = [];
                for (var i = 0; i < this._boundaries.length; i++){
                    var locations = [];
                    for (var j = 0; j < this._boundaries[i].length; j++){
                        var heading = Location.greatCircleAzimuth(oldReferenceLocation,
                            new Location(this._boundaries[i][j].latitude, this._boundaries[i][j].longitude));
                        var pathLength = Location.greatCircleDistance(oldReferenceLocation,
                            new Location(this._boundaries[i][j].latitude, this._boundaries[i][j].longitude));
                        var location = new Location(0, 0);
                        Location.greatCircleLocation(newReferenceLocation, heading, pathLength, location);
                        locations.push(new Location(location.latitude, location.longitude));
                    }
                    boundaries.push(locations);
                }
                this.boundaries = boundaries;
            }
            else if (this.boundaries.length > 2){
                var locations = [];
                for (var i = 0; i < this._boundaries.length; i++){
                    var heading = Location.greatCircleAzimuth(oldReferenceLocation,
                        new Location(this._boundaries[i].latitude, this._boundaries[i].longitude));
                    var pathLength = Location.greatCircleDistance(oldReferenceLocation,
                        new Location(this._boundaries[i].latitude, this._boundaries[i].longitude));
                    var location = new Location(0, 0);
                    Location.greatCircleLocation(newReferenceLocation, heading, pathLength, location);
                    locations.push(new Location(location.latitude, location.longitude));
                }
                this.boundaries = locations;
            }
            else {
                return;
            }
        };

        return SurfacePolygon;
    });