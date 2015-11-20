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
        type: 'ema',
        params: {
            period: 'x',
            index: 0
        },    
        styles: {
            lineWidth: 'x',
            strokeColor: 'y'
        }
    }]
    
    ***/

    var merge   = HC.merge,
        isArray = HC.isArray,
        minInArray = HC.Axis.prototype.minInArray,
        maxInArray = HC.Axis.prototype.maxInArray,
        UNDEFINED;
    
    Indicator.prototype.ema = {
        getDefaultOptions: function(){
            return {
                period: 14,
                index: 0,
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
                EMApercent = (2 / (period + 1)),
                calEMA = 0,
                range = 1,
                xValue = xVal[0],
                yValue = yVal[0],
                EMA = [],
                xData = [],
                yData = [],
                index = -1,
                point,i,points,
                EMAPoint;

           //check period, if bigger than points length, skip
           if(xVal.length <= period) {
            return;
           }


           //switch index for OHLC / Candlestick / Arearange
           if(isArray(yVal[0])) {
              index = params.index ? params.index : 0;
              yValue = yVal[0][index];
           }
           // starting point
           points = [[xValue, yValue]];
           
           // accumulate first N-points
           while(range != period){
               utils.accumulateAverage(points, xVal, yVal, range, index); 
               range ++; 
           }
           // calculate value one-by-one for each perdio in visible data
           for(i = range; i < yValLen; i++){
                                    EMAPoint = utils.populateAverage(points, xVal, yVal, i, EMApercent, calEMA, index);
                                    EMA.push(EMAPoint);
                                    xData.push(EMAPoint[0]);
                                    yData.push(EMAPoint[1]);
                  calEMA = EMAPoint[1]; 

                  utils.accumulateAverage(points, xVal, yVal, i, index);   
           }
           
                     EMAPoint = utils.populateAverage(points, xVal, yVal, i, EMApercent, calEMA, index);
                     EMA.push(EMAPoint);
                     xData.push(EMAPoint[0]);
                     yData.push(EMAPoint[1]);

            // registger extremes for axis;
                     options.yAxisMax = maxInArray(EMA);
                     options.yAxisMin = minInArray(EMA);
                     
           return {
             values: EMA,
             xData: xData,
             yData: yData
           };
           
        }, 
        getGraph: function(chart, series, options, values) {
           var path   = [],
               attrs  = {},
               xAxis  = series.xAxis,
               yAxis  = options.Axis = series.yAxis,
               ema    = values,
               emaLen = ema.length,
               emaX,
               emaY,
               i;

            if(options.visible === false) {
              return;
           }
               
           options.styles = attrs = merge({
               'stroke-width': 2,
               stroke: 'red',
               dashstyle: 'Dash'
           },  options.styles);  
           
           path.push('M', xAxis.toPixels(ema[0][0]), yAxis.toPixels(ema[0][1])); 
               
           for(i = 0; i < emaLen; i++){
              emaX = ema[i][0];
              emaY = ema[i][1];
              
              path.push('L', xAxis.toPixels(emaX), yAxis.toPixels(emaY));
           }

           return [chart.renderer.path(path).attr(attrs)];
        },
        utils: {
            accumulateAverage: function(points, xVal, yVal, i, index){ 

                var xValue = xVal[i],
                    yValue = index < 0 ? yVal[i] : yVal[i][index];
                    
                points.push([xValue, yValue]);
            },
            populateAverage: function(points, xVal, yVal, i, EMApercent, calEMA, index){
                var pLen       = points.length,
                    x          = xVal[i-1],
                    yValuePrev = index < 0 ? yVal[i-2] : yVal[i-2][index],
                    yValue     = index < 0 ? yVal[i-1] : yVal[i-1][index],
                    prevPoint,y;

                prevPoint = calEMA === 0 ? yValuePrev : calEMA;
                y = ((yValue * EMApercent) + (prevPoint * (1 - EMApercent)));

                return [x, y];
            }
        }
    };
})(Highcharts);