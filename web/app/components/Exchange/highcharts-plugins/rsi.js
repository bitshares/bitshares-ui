(function (HC) {
        /***
        
        Each indicator requires mothods:
        
        - getDefaultOptions()                                           - returns object with default parameters, like period etc.
        - getValues(chart, series, options, points) - returns array of calculated values for indicator
        - getGraph(chart, series, options, values)  - returns path, or columns as SVG elements to add.
                                                                                                    Doesn't add to the chart via renderer! 
        
        ***/
        
        /***
        indicators: [{
            id: 'series-id',
            type: 'rsi',
            params: {
                period: 'x',
                overbought: value_a,
                oversold: value_b,
                approximation: 'average',
                decimals: 5
            },    
            styles: {
                lineWidth: 'x',
                strokeColor: 'y'
            }
        }]
        
        ***/
        
        function toFixed(a, n) {
                return parseFloat(a.toFixed(n));    
        }
        
        var UNDEFINED,
                merge = HC.merge,
                isArray = HC.isArray,
        minInArray = HC.Axis.prototype.minInArray,
        maxInArray = HC.Axis.prototype.maxInArray,
        addAxisPane = HC.Axis.prototype.addAxisPane;
        
        Indicator.prototype.rsi = {
                getDefaultOptions: function(){
                        return {
                                period: 14,
                                overbought: 70,
                                oversold: 30,
                                approximation: "average",
                                decimals: 4
                        };
                },
                getValues: function(chart, series, options, points) {
                        var utils = this.utils,
                params = options.params,
                period = params.period,
                xVal = points[0].concat(series.processedXData || []), // #22
                yVal = points[1].concat(series.processedYData || []), // #22
                yValLen = yVal ? yVal.length : 0,
                EMA = Indicator.prototype.ema,
                decimals = params.decimals,
                //EMApercent = (2 / (period + 1)),
                //calEMAGain = 0,
                //calEMALoss = 0,
                range = 1,
                RSI = [],
                xData = [],
                yData = [],
                index = 3,
                gain = [],
                loss = [],
                i,
                RSIPoint, change, RS, avgGain, avgLoss;

           // atr requires close value     
           if((xVal.length <= period) || !isArray(yVal[0]) || yVal[0].length != 4 || EMA === UNDEFINED) {
              return;
           }
           
           // accumulate first N-points
           while(range < period + 1){
                change = toFixed(yVal[range][index] - yVal[range - 1][index], decimals);
                gain.push(change > 0 ? change : 0);
                loss.push(change < 0 ? Math.abs(change) : 0);
                range ++;
           }
           
           for(i = range - 1; i < yValLen; i++ ){
                             //gain.push(change > 0 ? change : 0);
                             //len = loss.push(change < 0 ? Math.abs(change) : 0); // better than loss.length
                 
                 // EMA for loss and gains
                 //avgGain = EMA.utils.populateAverage([], gain, [ yVal[i-1], [utils.sumArray(gain) / len] ], 2, EMApercent, calEMAGain, 0);
                 //avgLoss = EMA.utils.populateAverage([], gain, [ yVal[i-1], [utils.sumArray(loss) / len] ], 2, EMApercent, calEMALoss, 0);
               if( i > range - 1) {
                        // remove first point from array
                        gain.shift();
                      loss.shift();
                      // calculate new change
                                      change = toFixed(yVal[i][index] - yVal[i - 1][index], decimals);
                                      // add to array
                                      gain.push(change > 0 ? change : 0);
                                      loss.push(change < 0 ? Math.abs(change) : 0);
               }
               
               // calculate averages, RS, RSI values:
                             avgGain = toFixed(utils.sumArray(gain) / period, decimals);
                             avgLoss = toFixed(utils.sumArray(loss) / period, decimals);    
                 
                             if(avgLoss === 0) {
                                    RS = 100;
                             } else {
                                  RS = toFixed(avgGain / avgLoss, decimals);
                             }
                             RSIPoint = toFixed(100 - (100 / (1 + RS)), decimals);
                             RSI.push([xVal[i], RSIPoint]);
                             xData.push(xVal[i]);
                             yData.push(RSIPoint);  

                             //calEMAGain = avgGain[1]; 
                             //calEMALoss = avgLoss[1]; 
                     }
                     
                     options.yAxisMax = 100;
                     options.yAxisMin = 0;
                     
                     return {
                         values: RSI,
                         xData: xData,
                         yData: yData
                     };
                }, 
        getGraph: function(chart, series, options, values) {
           var path = [],
               attrs = {},
               xAxis = series.xAxis,
               atr = values,
               atrLen = atr.length,
               userOptions,
               yAxis,
               index,
               atrX,
               atrY,
               i,
               defaultOptions = {
                       min: 0,
                       tickInterval: 25,
                       plotLines: [{
                              value: options.params.overbought,
                              color: 'orange',
                              width: 1
                       }, {
                            value: options.params.oversold,
                              color: 'orange',
                              width: 1
                       }],
                       //height: 100,
                       max: 100,
                       title: {
                              text: 'RSI'
                       }
               };

           if(options.visible === false || !values) {
              return;
           }
          
           userOptions = merge(defaultOptions, options.yAxis);

           if(options.Axis === UNDEFINED) {
             index = addAxisPane(chart,userOptions); 
             options.Axis = chart.yAxis[index];
           } else {
                       Highcharts.each(options.Axis.plotLinesAndBands, function(p, i) {
                            p.options = merge(p.options, userOptions.plotLines[i]);
                            p.render();
                       });
           }

           yAxis = options.Axis;

           options.styles = attrs = merge({
               'stroke-width': 2,
               stroke: 'red',
               dashstyle: 'Dash'
           },  options.styles);  
           
           path.push('M', xAxis.toPixels(atr[0][0]), yAxis.toPixels(atr[0][1])); 
           for(i = 0; i < atrLen; i++) {
              atrX = atr[i][0];
              atrY = atr[i][1];
              path.push('L', xAxis.toPixels(atrX), yAxis.toPixels(atrY));
           }

           return [chart.renderer.path(path).attr(attrs)];
        },
                utils: {
                        sumArray: function(array){
                              // reduce VS loop => reduce
                                return array.reduce(function(prev, cur) {
                                        return prev + cur;
                                });
                        }
                }
        };
})(Highcharts);