function drawHistogram(data, countryId, dataType, sizes) {
     const {width, height, padding} = sizes.histogram;

     data = formatHistogramData(data, countryId);

    setHistogramChart(dataType, sizes);

    let monthNames = data.map(obj => obj.month);

    let {xScale, yScale} = drawHistAxes(data, dataType, monthNames, sizes);

    if (data.length === 0) {
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

    let bars = d3.select('.histogram__chart')
                .selectAll('rect')
                    .data(data);


    bars
        .exit()
        .remove();

    bars
        .enter()
        .append('rect')
            .classed('histogram__bar', true)
        .merge(bars)
            .attr('x', (d) => xScale(d.month) - 0.5 * (width - 2 * padding) / (monthNames.length - 1))
            .attr('width', (width - 2 * padding) / (monthNames.length - 1))
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

function formatHistogramData(data, countryId){
    return data = Object.keys(data).sort().map(month => {
        let matched = data[month].find(ctryObj => ctryObj.numericCode === countryId);
        if (matched) {
            let obj = {month: month}
            obj.cases = matched.cases;
            obj.deaths = matched.deaths;
            obj.population = matched.population;
            return obj;
        }     
    }).filter(data => data);
}

function drawHistAxes(data, dataType, monthNames, sizes) {
    const {width, height, padding} = sizes.histogram;

    let xScale = d3.scalePoint()
                    .domain(monthNames)
                    .range([padding, width - padding])

    let yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d[dataType])])
                    .range([height - padding, padding])

    d3.selectAll('.axis')
        .remove();

    let xAxis = d3.axisBottom(xScale)
                    .tickValues(monthNames);
    d3.select('.histogram__chart')
        .append('g')
            .classed('axis x-axis', true)
            .attr('transform', `translate(0, ${height - padding})`)
            .call(xAxis)
        .selectAll('text')
            .attr('transform', 'rotate(90)')
            .attr('text-anchor', 'start')
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")

    let yAxis = d3.axisLeft(yScale);
    d3.select('.histogram__chart')
        .append('g')
            .classed('axis y-axis', true)
            .attr('transform', `translate(${padding}, 0)`)
            .call(yAxis)

    return {xScale, yScale};
}

function setHistogramChart(dataType, sizes) {
    const {width, height, padding} = sizes.histogram;

    d3.select('.histogram__title')
            .classed('no-display', false);

    d3.select('.no-data')
        .remove();

    d3.select('.histogram__title')
        .classed('histogram__title', true)
        .text(`New ${dataType} for each month`)
        .attr('transform', `translate(${width / 2}, ${padding})`)
        .attr('text-anchor', 'middle')

    

}