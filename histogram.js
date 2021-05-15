function drawHistogram(allMonthsData, countryId, countryName, dataType, sizes) {
    const {width, height, padding} = sizes.histogram;

    allMonthsData = formatHistogramData(allMonthsData, countryId, dataType);

    setHistogramChart(dataType, countryName);

    let monthNames = allMonthsData.map(obj => obj.month);
    const barWidth = (width - 2 * padding) / (monthNames.length - 1)
    let {xScale, yScale} = drawHistAxes(allMonthsData, dataType, monthNames, sizes, barWidth);

    if (allMonthsData.length === 0) {
        d3.selectAll('.histogram__bar')
            .transition()
            .duration(200)
            .delay((d,idx) => idx * 50)
            .ease(d3.easeSin)
            .attr('y', height - padding)
            .attr('height', 0)
   
        d3.select('.histogram__chart')
        .append('text')
            .classed('no-data', true)
            .text('No Data Available for This Country')
            .attr('transform', `translate(${width / 2}, ${height / 2})`)
            .attr('text-anchor', 'middle')

        return;
    }

    let bars = d3.select('.histogram__main')
                .selectAll('rect')
                    .data(allMonthsData);
    bars
        .exit()
        .remove();

    bars
        .enter()
        .append('rect')
            .classed('histogram__bar', true)
        .merge(bars)
            .attr('x', (d) => xScale(d.month) - 0.5 * barWidth)
            .attr('width', barWidth)
            .attr('stroke', 'white')
            .on('mousemove', d => showTooltip(d, 'histogram', dataType))
            .on('mouseout', d => hideTooltip(d, 'histogram', dataType))
        .transition()
            .duration(200)
            .delay((d,idx) => idx * 50)
            .ease(d3.easeSin)
            .attr('y', height - padding)
            .attr('height', 0)
        .transition()
            .duration(200)
            .delay((d,idx) => idx * 50)
            .ease(d3.easeSin)
            .attr('y', d => yScale(d[dataType]))
            .attr('height', d => height - padding - yScale(d[dataType]))
            .attr('fill', (dataType === 'cases')? '#730e0e' : '#0c326b')
}
/** Extracts monthly data for the counntry in question
 * 
 * @param {array} allMonthsData [{month: [countryData]}]
                            countryData {
                                            cases,
                                            casesPerMil,
                                            continent,
                                            deaths,
                                            deathsPerMil,
                                            devIndex,
                                            isoCode,
                                            medianAge,
                                            name,
                                            numericCode,
                                            population,
                                            vaccines
                                        }
 * @param {string} countryId 
 * @param {string} dataType casesPerMil or deathsPerMil
 * @returns {array} [monthData]
                    monthData {cases, deaths, month, population}
 */
function formatHistogramData(allMonthsData, countryId, dataType){
    return allMonthsData = Object.keys(allMonthsData).sort().map(month => {
        let matched = allMonthsData[month].find(ctryObj => ctryObj.numericCode === countryId);
        if (matched) {
            let obj = {month: month}
            obj.cases = matched.cases;
            obj.deaths = matched.deaths;
            obj.population = matched.population;
            return obj;
        }     
    }).filter(month => month && !isNaN(month[dataType]));
}

function drawHistAxes(data, dataType, monthNames, sizes, barWidth) {
    const {width, height, padding} = sizes.histogram;

    d3.selectAll('.histogram__chart .axis')
        .remove();

    //x-Axis
    //x-Axis: Scale
    let xScale = d3.scalePoint()
                    .domain(monthNames)
                    .range([padding + barWidth / 2, width - padding  + barWidth / 2]);

    //x-Axis: Create and Call Axis
    let xAxis = d3.axisBottom(xScale)
                    .tickValues(monthNames);
    d3.select('.histogram__chart')
        .append('g')
            .classed('histogram__axis histogram__axis--x axis axis--x', true)
            .attr('transform', `translate(0, ${height - padding})`)
            .call(xAxis)
        .selectAll('text')
            .attr('transform', 'rotate(90)')
            .attr('text-anchor', 'start')
            .attr("y", 0)
            .attr("x", 0)
            .attr("dx", 1);    
    //x-Axis: Label        
    d3.select('.histogram__axis--x')
        .append('text')
            .classed('axis__label', true)
            .attr('x', '50%')
            .attr('y', padding - 10)
            .text('Months');            
    //x-Axis


    //y-Axis
    //y-Axis: Scale
    let yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d[dataType])])
                    .range([height - padding, padding]);

    //y-Axis: Create and Call Axis
    let yAxis = d3.axisLeft(yScale)
                .tickFormat(d3.format(".2s"));
    d3.select('.histogram__chart')
        .append('g')
            .classed('histogram__axis histogram__axis--y axis axis--y', true)
            .attr('transform', `translate(${padding}, 0)`)
            .call(yAxis);

    //y-Axis: Label        
    d3.select('.histogram__axis--y')
        .append('text')
            .classed('axis__label', true)
            .attr('x', -height / 2)
            .attr('y', - padding / 2)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text(`Number of new ${dataType}`);

    //y-Axis 

    return {xScale, yScale};
}

function setHistogramChart(dataType, countryName) {

    d3.select('.no-data')
        .remove();

    d3.select('.histogram__title')
        .text(`New ${dataType} for each month - ${countryName}`)
        .attr('y', 30)

}