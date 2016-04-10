import Highcharts from "highcharts/highstock";

(function (HC) {
    /***
    
    Each indicator requires mothods:
    
    - getDefaultOptions()                               - returns object with default parameters, like period etc.
    - getValues(chart, series, options, points) - returns array of calculated values for indicator
    - getGraph(chart, series, options, values)  - returns path, or columns as SVG elements to add.
                                                        Doesn't add to the chart via renderer! 
    
    ***/
    
    /***
    indicators: [{
        id: 'series-id',
        type: 'atr',
        params: {
            period: 'x'
        },    
        styles: {
            lineWidth: 'x',
            strokeColor: 'y'
        }
    }]
    
    ***/
    
    var merge = HC.merge,
        isArray = HC.isArray,
        addAxisPane = HC.Axis.prototype.addAxisPane,
        minInArray = HC.Axis.prototype.minInArray,
        maxInArray = HC.Axis.prototype.maxInArray,
        UNDEFINED;
    
    Indicator.prototype.atr = {
        getDefaultOptions: function(){
            return {
                period: 14,
                                approximation: "average"
            };
        },
        getValues: function(chart, series, options, extraPoints) {
            var utils = this.utils,
                params = options.params,
                period = params.period,
                xVal = extraPoints[0].concat(series.processedXData || []), // #22
                yVal = extraPoints[1].concat(series.processedYData || []), // #22
                yValLen = yVal ? yVal.length : 0,
                xValue = xVal[0],
                yValue = yVal[0],
                range = 1,
                prevATR = 0, TR = 0,
                ATR = [],
                xData = [],
                yData = [],
                point,i,index,points,yValue;

            points = [[xValue, yValue]];
           
            if((xVal.length <= period) || !isArray(yVal[0]) || yVal[0].length != 4) {
              return;
            }

            for(i = 1; i < yValLen; i++){
              
              utils.accumulateAverage(points, xVal, yVal, i);

              if(period < range) {
                  point = utils.populateAverage(points, xVal, yVal, i, period, prevATR);
                  prevATR = point[1];
                  ATR.push(point);
                  xData.push(point[0]);
                  yData.push(point[1]);
              } else if (period === range) {
                  prevATR = TR / (i-1);
                  ATR.push([xVal[i-1],prevATR]); 
                  range ++;
              } else {
                  TR += utils.getTR(yVal[i-1],yVal[i-2]);
                  range ++; 
              }
            }

           point = utils.populateAverage(points, xVal, yVal, i, period, prevATR);
           xData.push(point[0]);
           yData.push(point[1]);
           ATR.push(point);

            // registger extremes for axis;
                     options.yAxisMax = maxInArray(ATR);
                     options.yAxisMin = 0;
           
           return {
             values: ATR,
             xData: xData,
             yData: yData
           };
        }, 
        getGraph: function(chart, series, options, values) {
           var path = [],
               attrs = {},
               xAxis = series.xAxis,
               atrLen = values.length,
               max = maxInArray(values),
               yAxis,
               defaultOptions,
               userOptions,
               index,
               atrX,
               atrY,
               i;

               defaultOptions = {
                min: 0,
                max: max,
                //tickPixelInterval: 50,
                //height: 100,
                title: {
                  text: 'ATR'
                }
               }

           if(options.visible === false) {
              return;
           }

            userOptions = merge(defaultOptions, options.yAxis);
           
           if(options.Axis === UNDEFINED) {
             index = addAxisPane(chart,userOptions); 
             options.Axis = chart.yAxis[index];
             options.Axis.oldMax = max;
           } else {
                      // options.Axis.render();
           }

           yAxis = options.Axis;


           options.styles = attrs = merge({
               'stroke-width': 2,
               stroke: 'red',
               dashstyle: 'Dash'
           },  options.styles);  
           
           path.push('M', xAxis.toPixels(values[0][0]), yAxis.toPixels(values[0][1])); 

           for(i = 0; i < atrLen; i++) {
              atrX = values[i][0];
              atrY = values[i][1];
              path.push('L', xAxis.toPixels(atrX), yAxis.toPixels(atrY));
           }

           return [chart.renderer.path(path).attr(attrs)];
        },
        utils: {
            accumulateAverage: function(points, xVal, yVal, i){ 
                var xValue = xVal[i],
                    yValue = yVal[i];
                    
                points.push([xValue, yValue]);
            },
            populateAverage: function(points, xVal, yVal, i, period, prevATR){
                var pLen = points.length,
                    x = xVal[i-1],
                    TR = this.getTR(yVal[i-1],yVal[i-2]),
                    y;

                y = (((prevATR * (period - 1)) + TR) / period);
                return [x, y];
            },
            getTR: function(currentPoint, prevPoint) {
              var pointY = currentPoint,
                  prevY = prevPoint,
                  HL = pointY[1] - pointY[2],
                  HCp = prevY === UNDEFINED ? 0 : Math.abs(pointY[1] - prevY[3]),
                  LCp = prevY === UNDEFINED ? 0 : Math.abs(pointY[2] - prevY[3]),
                  TR = Math.max(HL,HCp,LCp);

              return TR;
            }
        }
    }
})(Highcharts);