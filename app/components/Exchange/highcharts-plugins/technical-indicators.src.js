import Highcharts from "highcharts/highstock";

(function (HC) {
        /***

        Each indicator requires mothods:

        - getDefaultOptions()                           - returns object with default parameters, like period etc.
        - getValues(chart, series, options) - returns array of calculated values for indicator
        - getGraph(chart, series, options)  - returns path, or columns as SVG elemnts to add.
                                                                                    Doesn't add to chart via renderer!

        ***/

        /***
        indicators: [{
            id: 'series-id',
            type: 'sma',
            params: {
                period: 'x',
                n: 'y'
            },
            styles: {
                lineWidth: 'x',
                strokeColor: 'y'
            }
        }]

        ***/



        var UNDEFINED,
                Chart = HC.Chart,
                Axis = HC.Axis,
                extend = HC.extend,
                each = HC.each,
                merge = HC.merge,
        mathMax = Math.max,
        NUMBER = "number";


        function error(name) {
                if(window.console){
                        console.error(name);
                }
        }

        function defined(obj) {
            return obj !== UNDEFINED && obj !== null;
        }

        function forceRedraw(s){
                if(s.indicators) {
                        each(s.indicators, function(el, i) {
                                el.isDirtyData = true;
                        });
                        each(s.chart.yAxis, function(el, i) {
                                el.render();
                        });
                        //s.indicators = null;
                }
        }

        HC.isArray = function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };

        HC.isObject = function(obj) {
            return typeof obj === 'object';
        };

        HC.splat = function (obj) {
            return HC.isArray(obj) ? obj : [obj];
        };

        HC.setOptions({
                tooltip: {
                        followPointer: true
                }
        });


        /***

        Wrappers:

        ***/
        /*
        *   Upadte height when height is changed:
        */
        HC.wrap(HC.Chart.prototype, 'setSize', function(p, w, h, a) {
                p.call(this, w, h, false);
                if(this.alignAxes) {
                        // #30
                        this.updateHeightAxes(20, false, false);
                        this.redraw(a);
                }
        });

        /*
        *  Remove corresponding indicators for series
        */
        HC.wrap(HC.Series.prototype, 'update', function(proceed, redraw, animation) {
                var tempIndics = [],
                        s = this,
                        tmpAxis, len, el;

                if(s.indicators) {
                        len = s.indicators.length;
                        while(len--) { // #21
                                el = s.indicators[len];
                                tempIndics.push(el.options);
                                el.destroy();
                        };
                        proceed.call(this, redraw, animation);
                        s = this; // get series reference back after update
                        len = tempIndics.length;
                        while(len--) { // #21
                            s.chart.addIndicator(tempIndics[len]);
                        };
                } else {
                        proceed.call(this, redraw, animation);
                }
        });

        /*
        *  Remove corresponding indicators for series
        */
        HC.wrap(HC.Series.prototype, 'remove', function(proceed, redraw, animation) {
                var s = this,
                        len;
                if(s.indicators) {
                    len = s.indicators.length;
                    while(len--) { // #21
                        s.indicators[len].destroy();
                    };
                    s.indicators = null;
                }

                proceed.call(this, redraw, animation);
        });

        /*
        *  Force redraw for indicator with new data
        */
        HC.wrap(HC.Series.prototype, 'setData', function(proceed, redraw, animation) {
                forceRedraw(this);
                /* if(this.chart.alignAxes) {
                        this.chart.updateHeightAxes(20, false);
                } */
                proceed.call(this, redraw, animation);
        });

        /*
        *  Force redraw for indicator when new point is added
        */
        HC.wrap(HC.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {
                forceRedraw(this);
                proceed.call(this, options, redraw, shift, animation);
        });


        /*
        *  Set visibility to true, but disable tooltip when needed. Required for forcing recalculation of values
        */
        HC.wrap(HC.Series.prototype, 'setVisible', function(proceed, vis, redraw) {
                var newVis = vis === UNDEFINED ? ( this.isVisible === UNDEFINED ? !this.visible : !this.isVisible) : vis,
                        showOrHide = newVis ? 'show' : 'hide',
                        series = this;

                if(series.indicators) {
                    series.isVisible = newVis;
                    series.hideInTooltip = !newVis;
                    proceed.call(series, true, true);
                    if(series.chart.legend && series.chart.legend.options.enabled) { // #20
                            series.chart.legend.colorizeItem(this, newVis);
                    }

                    // show or hide elements
                    each(['group', 'dataLabelsGroup', 'markerGroup', 'tracker'], function (key) {
                        if (series[key]) {
                            series[key][showOrHide]();
                        }
                    });
                    series.visible = true;
                }   else {
                        proceed.call(series, newVis, true);
                }
        });

        /*
        *  Force redraw for indicator with new point options, like value
        */
        HC.wrap(HC.Point.prototype, 'update', function(proceed, options, redraw) {
                forceRedraw(this.series);
                proceed.call(this, options, redraw);
        });

        /*
        *  Force redraw for indicator when one of points is removed
        */
        HC.wrap(HC.Point.prototype, 'remove', function(proceed, options, redraw, animation) {
                forceRedraw(this.series);
                proceed.call(this, options, redraw);
        });

    /*
    *  Set flag for hasData when indicator has own axis
    */
    HC.wrap(HC.Axis.prototype, 'render', function(p) {
            var oldHasData;
            function manageIndicators() {
                    var hasData = false,
                            indMin = Infinity,
                            indMax = -Infinity;
                        each(this.indicators, function(ind, i) {
                                if(ind.visible) {
                                        hasData = true;
                                        indMin = Math.min(indMin, ind.options.yAxisMin);
                                        indMax = Math.max(indMax, ind.options.yAxisMax);
                                }
                        });
                        if(hasData && indMax !== Infinity && indMin !== -Infinity ) {
                                this.isDirty = true;
                                this.isDirtyExtremes = true;
                                this.userMax = indMax;
                                this.userMin = indMin;
                        } else {
                                this.userMax = null;
                                this.userMin = null;
                        }
                        return hasData;
            }
                if(this.indicators && !this.hasVisibleSeries) {
                        // case 1: axis doesn't have series
                        oldHasData = manageIndicators.call(this);
                        this.hasData = typeof this.hasData == "function" ? function() { return oldHasData; } : oldHasData; // version 4.1.6 vs 4.1.7

                        if((typeof this.hasData == "function" && this.hasData()) || (typeof this.hasData !== "function" && this.hasData)) { // version 4.1.6 vs 4.1.7
                                this.setScale();
                                this.setTickPositions(true);

                                this.chart.getMargins(); // #38
                                HC.each(this.indicators, function(ind, e) {
                                    ind.drawGraph();
                                });
                        }
                } else if(this.indicators) {
                        // case 2: right now all series are 'visible', so we need to check param: isVisible
                        var hasData = false;

                        each(this.series, function(serie, i) {
                                if(serie.isVisible || (serie.isVisible === UNDEFINED && serie.visible)) {
                                    hasData = true;
                                }
                        });

                        if(!hasData) {
                                hasData = manageIndicators.call(this);
                        } else {
                                this.userMax = null;
                                this.userMin = null;
                        }
                        if(hasData) {
                                this.setScale();
                                this.setTickPositions(true);

                                this.chart.getMargins();
                        }
                        this.hasData = typeof this.hasData == "function" ? function() { return hasData } : hasData; // version 4.1.6 vs 4.1.7

                        HC.each(this.indicators, function(ind, e) {
                            ind.drawGraph();
                        });
                }
            p.call(this);
    });


    /*
        *       Tooltip formatter content
        */
        HC.wrap(HC.Tooltip.prototype, 'defaultFormatter', function (proceed, tooltip) {

            var items          = this.points || HC.splat(this),
                chart          = items[0].series.chart,
                x              = this.x,
                tooltipOptions = chart.tooltip.options,
                s;

            // build the header
            s = [tooltip.tooltipFooterHeaderFormatter(items[0])]; //#3397: abstraction to enable formatting of footer and header

            // build the values
            s = s.concat(tooltip.bodyFormatter(items));

            // footer
            s.push(tooltip.tooltipFooterHeaderFormatter(items[0], true)); //#3397: abstraction to enable formatting of footer and header

            return s.join('');

        });

        HC.wrap(HC.Tooltip.prototype, 'bodyFormatter', function (proceed, items) {
            return HC.map(items, function (item) {
                var tooltipOptions = item.series.tooltipOptions;
                return (tooltipOptions.pointFormatter || item.point.tooltipFormatter).call(item.point, tooltipOptions.pointFormat);
            });
        });

        /*
            Tooltip pointFormat
        */

        HC.wrap(HC.Point.prototype, 'tooltipFormatter', function (proceed, pointFormat) {

            // Insert options for valueDecimals, valuePrefix, and valueSuffix
            var series = this.series,
                indicators     = series.indicators,
                seriesTooltipOptions = series.tooltipOptions,
                tooltipOptions = series.chart.tooltip.options,
                valueDecimals = HC.pick(seriesTooltipOptions.valueDecimals, ''),
                valuePrefix = seriesTooltipOptions.valuePrefix || '',
                valueSuffix = seriesTooltipOptions.valueSuffix || '',
                x = this.x,
                graphLen = 0,
                indLen = 0,
                indTooltip,
                indPointFormat,
                k;

            // Loop over the point array map and replace unformatted values with sprintf formatting markup
            HC.each(series.pointArrayMap || ['y'], function (key) {
                key = '{point.' + key; // without the closing bracket
                if (valuePrefix || valueSuffix) {
                    pointFormat = pointFormat.replace(key + '}', valuePrefix + key + '}' + valueSuffix);
                }
                pointFormat = pointFormat.replace(key + '}', key + ':,.' + valueDecimals + 'f}');
            });

            if(indicators && indicators !== UNDEFINED && tooltipOptions.enabledIndicators) {

                // build the values of indicators
                HC.each(indicators,function(ind,i) {
                    if(typeof(ind.values) === 'undefined' || ind.visible === false) {
                        return;
                    }

                    HC.each(ind.values,function(val, j){
                        if(val[0] === x) {

                            if(ind.options.tooltip) {

                                indLen = val.length;
                                indTooltip = ind.options.tooltip;
                                indPointFormat = indTooltip.pointFormat;
                                pointFormat += HC.format(indPointFormat, {
                                    point: {
                                        bottomColor: indLen > 3 ? ind.graph[2].element.attributes.stroke.value : '',
                                        bottomLine: HC.numberFormat(val[3],3),
                                        x: val[0],
                                        y: indLen > 3 ? HC.numberFormat(val[2],3) : HC.numberFormat(val[1],3),
                                        color: indLen > 3 ? ind.graph[1].element.attributes.stroke.value : ind.graph[0].element.attributes.stroke.value,
                                        topLine: HC.numberFormat(val[1],3),
                                        topColor: ind.graph[0].element.attributes.stroke.value
                                    },
                                    series:ind
                                });

                            } else {

                                //default format
                                graphLen = ind.graph.length;
                                for(k = 0; k < graphLen; k++) {
                                    pointFormat += '<span style="font-weight:bold;color:' + ind.graph[k].element.attributes.stroke.value + ';">' + HC.splat(ind.options.names || ind.name)[k] + '</span>: ' + HC.numberFormat(val[k+1],3) + '<br/>';
                                }
                            }
                        }
                    });
                });
            }

            return HC.format(pointFormat, {
                point: this,
                series: this.series
            });
        });

        /***

        Add legend items:

        ***/


        /*
        * Add indicators to legend
        */
        HC.wrap(HC.Legend.prototype, 'getAllItems', function(p) {
                var allItems = p.call(this),
                        indicators = this.chart.indicators;
                if(indicators) {
                        HC.each(indicators.allItems, function(e, i) {
                                if(e.options.showInLegend) {
                                        allItems.push(e);
                                }
                        });
                }
                return allItems;
        });


        /*
        * Render indicator
        */
        HC.wrap(HC.Legend.prototype, 'renderItem', function(p, item) {
                if(item instanceof Indicator) {
                        var series = item.series;
                        item.series = null;
                        item.color = item.options.styles.stroke;
                        p.call(this, item);
                        item.series = series;
                } else {
                        p.call(this, item);
                }
        });


        HC.wrap(HC.Point.prototype, 'getLabelConfig', function(proceed, point, mouseEvent) {
            var point = this;

            return {
                x: point.category,
                y: point.y,
                indicators: point.indicators,
                key: point.name || point.category,
                series: point.series,
                point: point,
                percentage: point.percentage,
                total: point.total || point.stackTotal
            };
        });

        HC.wrap(HC.Point.prototype, 'init', function(proceed, series, options, x) {
            var point = this,
                colors;

            point.series = series;
            point.color = series.color; // #3445
            point.applyOptions(options, x);
            point.pointAttr = {};
            point.indicators = {};

            if (series.options.colorByPoint) {
                colors = series.options.colors || series.chart.options.colors;
                point.color = point.color || colors[series.colorCounter++];
                // loop back to zero
                if (series.colorCounter === colors.length) {
                    series.colorCounter = 0;
                }
            }

            series.chart.pointCount++;
            return point;
        });

        /*
        * When hovering legend item, use isVisible instead of visible property
        */
        HC.wrap(HC.Legend.prototype, 'setItemEvents', function(p, item, legendItem, useHTML, itemStyle, itemHiddenStyle) {
                p.call(this, item, legendItem, useHTML, itemStyle, itemHiddenStyle);
                (useHTML ? legendItem : item.legendGroup).on('mouseout', function () {
                        var style = item.isVisible === UNDEFINED ?
                                                (item.visible ? itemStyle : itemHiddenStyle) : (item.isVisible ? itemStyle : itemHiddenStyle);
                        legendItem.css(style);
                        item.setState();
                })
        });

        /***

        Indicator Class:

        ***/

        window.Indicator = function () {
            this.init.apply(this, arguments);
        };

        Indicator.prototype = {
            /*
            * Initialize the indicator
            */
            init: function (chart, options) {
                // set default params, when not specified in params
                if(!Indicator.prototype[options.type]) error("Indicator: " + options.type + " not found!");
                options.params = merge({}, Indicator.prototype[options.type].getDefaultOptions(), options.params);

                this.chart = chart;
                this.options = options;
                this.series = chart.get(options.id);
                this.name = options.name === UNDEFINED ? options.type : options.name;
                this.visible = options.visible === UNDEFINED ? true : options.visible;

                if(!this.series.indicators) {
                        this.series.indicators = [];
                }
                this.series.indicators.push(this);
            },

            /*
            * Render the indicator
            */
            render: function (redraw) {
                var indicator = this,
                        chart = this.chart,
                        renderer = chart.renderer,
                        graph = this.graph,
                        group = this.group,
                        options = this.options,
                        series = this.series,
                        clipPath = this.clipPath,
                        visible = options.visible,
                        pointsBeyondExtremes,
                        arrayValues,
                        extremes;

                if(!indicator.visible) return;

                if (!group) {
                        indicator.group = group = renderer.g().add(chart.indicators.group);
                }

                if(!series) {
                        error('Series not found');
                        return false;
                } else if(!graph) {
                        arrayValues = Indicator.prototype[options.type].getValues(chart, { points: [] }, options, [series.xData, series.yData]);
                        if(!arrayValues) { //#6 - create dummy data
                            arrayValues = {
                                values: [[]],
                                xData: [[]],
                                yData: [[]]
                            };
                        }

                        this.values = this.currentPoints = arrayValues.values;
                        this.xData = arrayValues.xData;
                        this.yData = arrayValues.yData;
                        this.groupPoints(series);
                        this.graph = graph = Indicator.prototype[options.type].getGraph(chart, series, options, this.values);

                        if(graph) {
                            var len = graph.length,
                                i;

                            for(i = 0; i < len ;i++) {
                                graph[i].add(group);
                            }
                        }
                        // indicator has connection to the specific Axis, like RSI or ATR
                        if(indicator.options.Axis) {
                                indicator.options.Axis.indicators = indicator.options.Axis.indicators || [];
                                indicator.options.Axis.indicators.push(indicator);
                                if(indicator.clipPath) indicator.clipPath.destroy();
                                indicator.clipPath = renderer.clipRect({
                                        x: indicator.options.Axis.left,
                                        y: indicator.options.Axis.top,
                                        width: indicator.options.Axis.width,
                                        height: indicator.options.Axis.height
                                });
                                group.clip(indicator.clipPath);
                        }
                }
                if(chart.legend && chart.legend.options.enabled) {
                        chart.legend.render();
                }
            },

            /*
            * Redraw the indicator
            */
            redraw: function () {
                var options = this.options,
                        chart = this.chart,
                        series = this.series,
                        graph = this.graph,
                        group = this.group,
                        isDirtyData = this.isDirtyData,
                        visible = options.visible,
                        axis = options.Axis,
                        pointsBeyondExtremes,
                        arrayValues,
                        extremes;

                if(!this.visible) {
                    // remove extremes
                    options.yAxisMax = null;
                    options.yAxisMin = null;
                    this.values = [[]];
                    return;
                }
                // only after series.setData() or series.addPoint() etc.
                if(isDirtyData) {
                    arrayValues = Indicator.prototype[options.type].getValues(chart, { points: [] }, options, [series.xData, series.yData]);
                    if(!arrayValues) { //#6 - create dummy data
                            arrayValues = {
                                    values: [[]],
                                    xData: [[]],
                                    yData: [[]]
                            }
                    }
                    this.values = this.currentPoints = arrayValues.values;
                    this.xData = arrayValues.xData;
                    this.yData = arrayValues.yData;
                }
                // always check if points should be grouped, like after setExtremes() which doesn't change data
                this.groupPoints(series);
            },

            /*
            * Draw graph
            */
            drawGraph: function() {
                var ind = this,
                    graph = this.graph,
                    len = graph.length,
                    i;

                if(graph) {
                        for(i = 0; i < len ;i++) {
                                graph[i].destroy();
                        }
                }
                ind.graph = Indicator.prototype[ind.options.type].getGraph(ind.chart, ind.series, ind.options, ind.values);

                if(ind.graph) {
                        ind.clipPath.attr({
                                x: ind.options.Axis.left,
                                y: ind.options.Axis.top,
                                width: ind.options.Axis.width,
                                height: ind.options.Axis.height
                        });
                        for(i = 0; i < len ;i++) {
                            ind.graph[i].add(ind.group);
                        }
                }
            },

            /*
            * Group points to allow calculation before extremes
            */
            groupPoints: function(series) {
                    var points = [[], []],
                        start = series.cropStart,
                        end,
                        length = HC.splat(this.options.params.period)[0], //#23 - don't use cropShoulded - it's broken since v1.3.6
                        minLen = Math.max(0, start - length - 1), // cropping starts from 0 at least
                        maxLen = series.options.data.length,
                        groupedPoints = [],
                        currentData = [],
                        xAxis = series.xAxis,
                        groupIntervalFactor,
                        interval,
                        ex,
                        xMin, xMax,
                        yData, groupPositions,
                        processedXData,
                        processedXDataLength,
                        totalRange,
                        defaultDataGroupingUnits = [[
                            'millisecond', // unit name
                            [1, 2, 5, 10, 20, 25, 50, 100, 200, 500] // allowed multiples
                        ], [
                            'second',
                            [1, 2, 5, 10, 15, 30]
                        ], [
                            'minute',
                            [1, 2, 5, 10, 15, 30]
                        ], [
                            'hour',
                            [1, 2, 3, 4, 6, 8, 12]
                        ], [
                            'day',
                            [1]
                        ], [
                            'week',
                            [1]
                        ], [
                            'month',
                            [1, 3, 6]
                        ], [
                            'year',
                            null
                        ]
                    ];

                    if(series.currentDataGrouping) {
                            ex = xAxis.getExtremes();
                            xMin = ex.min;
                            xMax = ex.max;
                            totalRange = series.currentDataGrouping.totalRange;
                            processedXData = series.processedXData.slice();
                            processedXDataLength = processedXData.length;
                            end = this.getCropEnd(start, xMax, this.xData);
                            groupIntervalFactor = (xAxis.options.ordinal && xAxis.getGroupIntervalFactor(xMin,xMax, series)) || 1;
                            interval = (series.groupPixelWidth * (xMax - xMin) / series.chart.plotSizeX) * groupIntervalFactor;
                            groupPositions = series.xAxis.getTimeTicks(
                                series.currentDataGrouping,
                                xMin,
                                xMax,
                                xAxis.options.startOfWeek,
                                processedXData,
                                series.closestPointRange
                            );
                            groupedPoints = this.groupData(this.xData.slice(Math.max(0, start - length), end), this.yData.slice(Math.max(0, start - length), end), groupPositions.slice(), this.options.params.approximation);
                            this.processedXData = groupedPoints[0];
                            this.processedYData = yData = groupedPoints[1];
                    } else {
                            this.processedXData = this.xData.slice(minLen, maxLen); //copy default data
                            this.processedYData = yData = this.yData.slice(minLen, maxLen);
                    }
                    // merge current points
                    HC.each(this.processedXData, function(p, i){
                            if(HC.isArray(yData[i])) {
                                    currentData.push( [p].concat(yData[i]) );
                            } else {
                                    currentData.push( [p, yData[i]] );
                            }
                    });

                    this.options.yAxisMin = Math.min.apply(null, Array.prototype.concat.apply([], this.processedYData)); // new extremes
                    this.options.yAxisMax = Math.max.apply(null, Array.prototype.concat.apply([], this.processedYData)); // new extremes
                    this.values = currentData;
                    this.applyTooltipPoints();
            },
            /*
            * Mechanism for goruping points into grouped positions
            */
            groupData: function (xData, yData, groupPositions, approximation) {
                    var ind = this,
                            groupedXData = [],
                            groupedYData = [],
                            groupedY,
                            dataLength = xData.length,
                            pointY,
                            pointX,
                            values = [[], [], [], []],
                            approximationFn = typeof approximation === 'function' ? approximation : HC.approximations[approximation],
                            i;

                    // Start with the first point within the X axis range (#2696)
                    for (i = 0; i <= dataLength; i++) {
                        if (xData[i] >= groupPositions[0]) {
                            break;
                        }
                    }

                    for (; i <= dataLength; i++) {
                        // when a new group is entered, summarize and initiate the previous group
                        while ((groupPositions[1] !== UNDEFINED && xData[i] >= groupPositions[1]) ||
                                i === dataLength) { // get the last group

                            // get group x and y
                            pointX = groupPositions.shift();
                            groupedY = approximationFn.apply(0, values);

                            // push the grouped data
                            if (groupedY !== UNDEFINED) {
                                groupedXData.push(pointX);
                                groupedYData.push(groupedY);
                            }

                            // reset the aggregate arrays
                            values[0] = [];
                            values[1] = [];
                            values[2] = [];
                            values[3] = [];

                            // don't loop beyond the last group
                            if (i === dataLength) {
                                break;
                            }
                        }

                        // break out
                        if (i === dataLength) {
                            break;
                        }

                        pointY = yData[i];
                        if (pointY === null) {
                            values[0].hasNulls = true;
                        } else if(typeof pointY === NUMBER){
                            values[0].push(pointY);
                        } else {
                            HC.each(pointY, function(e, i) {
                                values[i].push(e);
                            });
                        }
                    }

                    return [groupedXData, groupedYData];
            },

            /*
            * Apply indicator's value to the grouped, corresponding points
            */
            applyTooltipPoints: function() {
                var indicator = this,
                        values = indicator.values,
                        vLen = values.length,
                        points = indicator.series.points,
                        pLen = points ? points.length : 0,
                        diff = pLen - vLen,
                        point,
                        i;

                for(i = diff; i < pLen; i++){
                    point = points[i];
                    if(point) {
                        point.indicators[indicator.options.type] = values[i - diff];
                    }
                }
            },
            /*
            * Get right edge of the data actually displayed on the chart. cropStart is stored, but cropEnd we need to find
            */
            getCropEnd: function(start, max, data) {
                    var len = data.length,
                            i = start;
                    while(i < len) {
                          if(data[i] >= max) {
                                break;
                          }
                            i++;
                    }
                    return i + 1;
            },
            /*
            * Destroy the indicator
            */
            destroy: function (redraw) {
                var indicator = this,
                        chart = this.chart,
                        allItems = chart.indicators.allItems,
                        index = allItems.indexOf(indicator),
                        Axis = this.options.Axis;

                // remove from all indicators array
                if (index > -1) {
                    allItems.splice(index, 1);
                }
                // remove from series.indicators
                index = indicator.series.indicators.indexOf(indicator);
                if(index > -1) {
                        indicator.series.indicators.splice(index, 1);
                }

                // remove from yAxis.indicators
                index = Axis.indicators.indexOf(indicator);
                if(index > -1) {
                        Axis.indicators.splice(index, 1);
                }

                if(indicator.legendGroup) {
                        indicator.legendGroup.destroy();
                        if(chart.legend && chart.legend.options.enabled) {
                                chart.legend.render();
                        }
                }

                //remove axis if that was the last one indicator
                if(Axis && Axis.series.length === 0 && Axis.indicators && Axis.indicators.length === 0) {
                    Axis.remove();
                    this.options.Axis = UNDEFINED;
                    chart.indicators.haveAxes --; // #18: decrement number of axes to be updated
                    if(chart.alignAxes) {
                            chart.updateHeightAxes(20, false, true);
                    }
                }

                // remove group with graph
                if (indicator.group) {
                    indicator.group.destroy();
                    indicator.group = null;
                }

                // remove points from tooltip #29
                each(indicator.series.points, function(p) {
                    if(p && p.indicators && p.indicators[indicator.options.type]){
                        delete p.indicators[indicator.options.type];
                    }
        });
                indicator = null;
                chart.redraw(redraw);
            },

            /*
            * setState for indicator?
            */
            setState: function(state) {

            },

            /*
            * Hide or show indicator
            */
            setVisible: function(vis, redraw) {
                var indicator = this,
                        oldVis = indicator.visible,
                        newVis,
                        method;

                if(vis === UNDEFINED) {
                        newVis = oldVis ? false : true;
                        method = oldVis ? 'hide' : 'show';
                } else {
                        newVis = vis;
                        method = vis ? 'show' : 'hide';
                }

                if (this.options.showInLegend) {
                        this.chart.legend.colorizeItem(this, newVis);
                }
                this.visible = newVis;

                indicator[method]();
                indicator.redraw();

                // hide axis by resetting extremes
                if(this.options.Axis) {
                        this.options.Axis.render();
                }

            },

            /*
            * Draw symbol in legend - should be simple line
            */

            drawLegendSymbol: function(legend) {
                    var options = this.options,
                            markerOptions = options.marker,
                            radius,
                            legendOptions = legend.options,
                            legendSymbol,
                            symbolWidth = legend.symbolWidth,
                            renderer = this.chart.renderer,
                            legendItemGroup = this.legendGroup,
                            verticalCenter = legend.baseline - Math.round(renderer.fontMetrics(legendOptions.itemStyle.fontSize, this.legendItem).b * 0.3),
                            attr;

                    // Draw the line
                    attr = {
                        'stroke-width': options.lineWidth || 2
                    };
                    if (options.styles && options.styles.dashstyle) {
                        attr.dashstyle = options.styles.dashstyle;
                    }
                    this.legendLine = renderer.path([
                        'M',
                        0,
                        verticalCenter,
                        'L',
                        symbolWidth,
                        verticalCenter
                    ])
                    .attr(attr)
                    .add(legendItemGroup);
            },

            /*
            * Update the indicator with a given options
            */
            update: function (options, redraw) {
                merge(true, this.options, options);

                this.redraw(redraw);
                this.options.Axis.render();
            },

            /*
            * Hide the indicator
            */
            hide: function() {
                    this.group.hide();
                    this.visible = false;
            },

            /*
            * Show the indicator
            */
            show: function() {
                    this.group.show();
                    this.visible = true;
            }
        };



        // Add indicator methods to chart prototype
        extend(Chart.prototype, {
                /*
                * Adding indicator to the chart
                */
                addIndicator: function (options, redraw) {
                    var chart = this,
                            indicators = chart.indicators.allItems,
                            item;

                    item = new Indicator(chart, options);
                    indicators.push(item);
                    item.render(redraw);
                    chart.redraw(redraw);
                    return item;
                },
                /*
                 * Redraw all indicators, method used in chart events
                 */
                redrawIndicators: function () {
                        var chart = this;

                        each(chart.indicators.allItems, function (indicator) {
                                    indicator.redraw();
                        });
                        // we need two loops - one to calculate values and register extremes
                        // and second to draw paths with proper extremes on yAxis
                        each(chart.yAxis, function (axis) {
                                    axis.render();
                        });

                },
                /*
                 * updates axes and returns new and normalized height for each of them.
                 */
                updateHeightAxes: function(topDiff, add, afterRemove) {
                        var chart = this,
                                chYxis = chart.yAxis,
                len = chYxis.length,
                calcLen = len,
                i = 0,
                sum = chart.chartHeight - chart.plotTop - chart.marginBottom, //workaround until chart.plotHeight will return real value
                indexWithoutNav = 0,
                newHeight,
                top;

            // #18 - don't update axes when none of indicators have separate axis
            if(afterRemove !== true && (!chart.indicators || chart.indicators.haveAxes == 0 || chart.indicators.allItems.length === 0)) return;

            // when we want to remove axis, e.g. after indicator remove
            // #17 - we need to consider navigator (disabled vs enabled) when calculating height in advance
            if(!add && chart.options.navigator.enabled) {
                calcLen--;
            } else if(add && !chart.options.navigator.enabled){
                calcLen++;
            }

                        newHeight = (sum - (calcLen-1) * topDiff) / calcLen;
            //update all axis
            for (;i < len; i++) {
                var yAxis = chYxis[i];

                if(yAxis.options.id !== 'navigator-y-axis') {
                        top = chart.plotTop + indexWithoutNav * (topDiff + newHeight);

                                        if(yAxis.top !== top || yAxis.height !== newHeight) {
                                                chYxis[i].update({
                                                        top: top,
                                                        height: newHeight
                                                }, false);
                                        }
                        indexWithoutNav++;
                }
            }
            return newHeight;
                }
        });

        // Add yAxis as pane
        extend(Axis.prototype, {
                /*
                 * When new indicator is added, sometimes we need new pane.
                 * Note: It automatically scales all of other axes unless alignAxes is set to false.
                 */
                addAxisPane: function(chart, userOptions) {
                        chart.indicators.haveAxes++;    // #18: increment number of axes

                        var topDiff = 20,
                                height,
                                yLen = chart.options.navigator.enabled ? chart.yAxis.length - 1 : chart.yAxis.length, // #17 - don't count navigator
                                defaultOptions,
                              options;

                        if(chart.alignAxes) {
                            height = chart.updateHeightAxes(topDiff, true),
                            defaultOptions = {
                                        labels: {
                                                align: 'left',
                                                x: 2,
                                                y: -2
                                        },
                                        offset: chart.alignAxes ? 0 : null,
                                        height: height,
                                        top: chart.plotTop + yLen * (topDiff + height) ,
                                        min: 0,
                                        max: 100
                                };
                        } else {
                                defaultOptions = {
                                        min: 0,
                                        max: 100
                                };
                        }

                        options = merge(defaultOptions,userOptions);

                        //add new axis
                        chart.preventIndicators = true;
                        chart.addAxis(options, false, true, false);
                        chart.preventIndicators = false;
                        return chart.yAxis.length - 1;
                },

                minInArray: function(arr) {
                        return arr.reduce(function(min, arr) {
                                return Math.min(min, arr[1]);
                        }, Infinity);
                },
                maxInArray: function(arr) {
                        return arr.reduce(function(max, arr) {
                                return Math.max(max, arr[1]);
                        }, -Infinity);
                }
        });

        // Initialize on chart load
        Chart.prototype.callbacks.push(function (chart) {
        var options = chart.options.indicators,
                optionsLen = options ? options.length : 0,
                i = 0,
                        group,
                        exportingFlag = true;

        group = chart.renderer.g("indicators");
        group.attr({
                zIndex: 2
        });
        group.add();

        if(!chart.indicators) chart.indicators = {};

        // initialize empty array for indicators
        if(!chart.indicators.allItems) chart.indicators.allItems = [];


        // link chart object to indicators
        chart.indicators.chart = chart;

        // link indicators group element to the chart
        chart.indicators.group = group;

        // counter for axes #18
        chart.indicators.haveAxes = 0;
        chart.alignAxes = defined(chart.options.chart.alignAxes) ? chart.options.chart.alignAxes : true;

        for(i = 0; i < optionsLen; i++) {
                chart.addIndicator(options[i], false);
                if((chart.get(options[i].id).data.length - 1) <= options[i].params.period) // SPLAT?
                    exportingFlag = false;
        }

                 // update indicators after chart redraw
                Highcharts.addEvent(chart, 'redraw', function () {
                        if(!chart.preventIndicators) {
                            chart.redrawIndicators();
                        }
                        chart.preventIndicators = false;
                });

                if(exportingFlag && optionsLen > 0 && chart.series && chart.series.length > 0) { // #16 & #27
                        chart.isDirtyLegend = true;
                      chart.series[0].isDirty = true;
                        chart.series[0].isDirtyData = true;
                        chart.redraw(false);
                }
        });

        HC.approximations = {
            sum: function (arr) {
                var len = arr.length,
                    ret;

                // 1. it consists of nulls exclusively
                if (!len && arr.hasNulls) {
                    ret = null;
                // 2. it has a length and real values
                } else if (len) {
                    ret = 0;
                    while (len--) {
                        ret += arr[len];
                    }
                }
                // 3. it has zero length, so just return undefined
                // => doNothing()

                return ret;
            },
            average: function (arr) {
                var len = arr.length,
                    ret = HC.approximations.sum(arr);

                // If we have a number, return it divided by the length. If not, return
                // null or undefined based on what the sum method finds.
                if (typeof ret === NUMBER && len) {
                    ret = ret / len;
                }

                return ret;
            },
            open: function (arr) {
                return arr.length ? arr[0] : (arr.hasNulls ? null : UNDEFINED);
            },
            high: function (arr) {
                return arr.length ? HC.arrayMax(arr) : (arr.hasNulls ? null : UNDEFINED);
            },
            low: function (arr) {
                return arr.length ? HC.arrayMin(arr) : (arr.hasNulls ? null : UNDEFINED);
            },
            close: function (arr) {
                return arr.length ? arr[arr.length - 1] : (arr.hasNulls ? null : UNDEFINED);
            },
            // ohlc and range are special cases where a multidimensional array is input and an array is output
            ohlc: function (open, high, low, close) {
                open = HC.approximations.open(open);
                high = HC.approximations.high(high);
                low = HC.approximations.low(low);
                close = HC.approximations.close(close);

                if (typeof open === NUMBER || typeof high === NUMBER || typeof low === NUMBER || typeof close === NUMBER) {
                    return [open, high, low, close];
                }
                // else, return is undefined
            },
            range: function (low, high) {
                low = HC.approximations.low(low);
                high = HC.approximations.high(high);

                if (typeof low === NUMBER || typeof high === NUMBER) {
                    return [low, high];
                }
                // else, return is undefined
            }
        };

})(Highcharts);
