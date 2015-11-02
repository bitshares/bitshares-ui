/**
* Highstock plugin for displaying current price indicator.
*
* Author: Roland Banguiran
* Email: banguiran@gmail.com
*
*/

// JSLint options:
/*global Highcharts, document */

import utils from "common/utils";

(function(H) {
    'use strict';
    var merge = H.merge;

    H.wrap(H.Chart.prototype, 'init', function(proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        renderCurrentPriceIndicator(this);
    });

    H.wrap(H.Chart.prototype, 'redraw', function(proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        renderCurrentPriceIndicator(this);
    });

    function renderCurrentPriceIndicator(chart) {
        if (!chart.series[0] || (chart.series[0] && chart.series[0].yData && !chart.series[0].yData.length)) {
            return;
        }
        var priceYAxis = chart.yAxis[0],
            priceSeries = chart.series[0],
            priceData = priceSeries.yData,
            currentPrice = priceData[priceData.length - 1][3],

            extremes = priceYAxis.getExtremes(),
            min = extremes.min,
            max = extremes.max,

            options = chart.options.yAxis[0].currentPriceIndicator,
            defaultOptions = {
                backgroundColor: '#000000',
                borderColor: '#000000',
                lineColor: '#000000',
                lineDashStyle: 'Solid',
                lineOpacity: 0.8,
                enabled: true,
                style: {
                    color: '#ffffff',
                    fontSize: '11px'
                },
                x: 0,
                y: 0,
                zIndex: 7
            },

            chartWidth = chart.chartWidth,
            chartHeight = chart.chartHeight,
            marginRight = chart.optionsMarginRight || 0,
            marginLeft = chart.optionsMarginLeft || 0,

            renderer = chart.renderer,

            currentPriceIndicator = priceYAxis.currentPriceIndicator || {},
            isRendered = Object.keys(currentPriceIndicator).length,

            group = currentPriceIndicator.group,
            label = currentPriceIndicator.label,
            box = currentPriceIndicator.box,
            line = currentPriceIndicator.line,

            width,
            height,
            x,
            y,

            lineFrom;

        options = merge(true, defaultOptions, options);

        width = priceYAxis.opposite ? (marginRight ? marginRight : 40) : (marginLeft ? marginLeft : 40);
        x = priceYAxis.opposite ? chartWidth - width : marginLeft;
        y = priceYAxis.toPixels(currentPrice);

        lineFrom = priceYAxis.opposite ? marginLeft : chartWidth - marginRight;

        // offset
        x += options.x;
        y += options.y;

        if (options.enabled) {

            // render or animate
            if (!isRendered) {
                // group
                group = renderer.g()
                    .attr({
                    zIndex: options.zIndex
                })
                    .add();

                // label
                label = renderer.text(utils.format_number(currentPrice, options.precision), x, y)
                    .attr({
                    zIndex: 2
                })
                    .css({
                    color: options.style.color,
                    fontSize: options.style.fontSize
                })
                    .add(group);

                height = label.getBBox().height;

                // box
                box = renderer.rect(x, y - (height / 2), options.width ? options.width : width, height)
                    .attr({
                    fill: options.backgroundColor,
                    stroke: options.borderColor,
                    zIndex: 1,
                        'stroke-width': 1
                })
                    .add(group);

                // box
                line = renderer.path(['M', lineFrom, y, 'L', x, y])
                    .attr({
                    stroke: options.lineColor,
                    'stroke-dasharray': dashStyleToArray(options.lineDashStyle, 1),
                    'stroke-width': 1,
                    opacity: options.lineOpacity,
                    zIndex: 1,
                })
                .add(group);

                // adjust
                label.animate({
                    y: y + (height / 4)
                }, 0);
            } else {
                currentPriceIndicator.label.animate({
                    text: utils.format_number(currentPrice, options.precision),
                    y: y
                }, 0);

                height = currentPriceIndicator.label.getBBox().height;

                currentPriceIndicator.box.animate({
                    y: y - (height / 2)
                }, 0);

                currentPriceIndicator.line.animate({
                    d: ['M', lineFrom, y, 'L', x, y]
                }, 0);

                // adjust
                currentPriceIndicator.label.animate({
                    y: y + (height / 4)
                }, 0);
            }

            if (currentPrice > min && currentPrice < max) {
                group.show();
            } else {
                group.hide();
            }

            // register to price y-axis object
            priceYAxis.currentPriceIndicator = {
                group: group,
                label: label,
                box: box,
                line: line
            }
        }
    };
    
    /**
     * Convert dash style name to array to be used a the value
     * for SVG element's "stroke-dasharray" attribute
     * @param {String} dashStyle    Possible values: 'Solid', 'Shortdot', 'Shortdash', etc
     * @param {Integer} width   SVG element's "stroke-width"
     * @param {Array} value
     */
    function dashStyleToArray(dashStyle, width) {
        var value;

        dashStyle = dashStyle.toLowerCase();
        width = (typeof width !== 'undefined' && width !== 0) ? width : 1;

        if (dashStyle === 'solid') {
            value = 'none';
        } else if (dashStyle) {
            value = dashStyle
                .replace('shortdashdotdot', '3,1,1,1,1,1,')
                .replace('shortdashdot', '3,1,1,1')
                .replace('shortdot', '1,1,')
                .replace('shortdash', '3,1,')
                .replace('longdash', '8,3,')
                .replace(/dot/g, '1,3,')
                .replace('dash', '4,3,')
                .replace(/,$/, '')
                .split(','); // ending comma

            i = value.length;
            while (i--) {
                value[i] = parseInt(value[i]) * width;
            }
            value = value.join(',');
        }

        return value;
    };
}(Highcharts));