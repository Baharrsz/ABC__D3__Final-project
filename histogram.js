function drawHistogram(data, countryId, dataType) {
    const width = 500;
    const height = 500;
    const padding = 75;

    d3.select('.no-data')
        .remove();


    
    data = Object.keys(data).sort().map(month => {
        let matched = data[month].find(ctryObj => ctryObj.numericCode === countryId);
        if (matched) {
            let obj = {month: month}
            obj.cases = matched.cases;
            obj.deaths = matched.deaths;
            obj.population = matched.population;
            return obj;
        }     
    }).filter(data => data);

    console.log('dataAfter', data)


    


    let monthNames = data.map(obj => obj.month);


    let xScale = d3.scalePoint()
                    .domain(monthNames)
                    .range([padding, width - padding])

    let yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d[dataType])])
                    .range([height - padding, padding])

    drawAxes(xScale, yScale, height, padding, monthNames);




    let bars = d3.select('.histogram__chart')
                    .attr('width', width)
                    .attr('height', height)
                .selectAll('rect')
                    .data(data);

    if (data.length === 0) {
        d3.select('.histogram__chart')
        .append('text')
            .classed('no-data', true)
            .text('No Data Available for This Country')
            .attr('transform', `translate(${height / 2}, ${height / 2})`)
            .attr('text-anchor', 'middle')

        return;
    }


    bars
        .exit()
        .remove();

    bars
        .enter()
        .append('rect')
            .classed('histogram__bin', true)
        .merge(bars)
            .attr('x', (d, idx) => xScale(d.month) - 0.5 * (width - 2 * padding) / (monthNames.length - 1))
            .attr('width', (width - 2 * padding) / (monthNames.length - 1))
            .on('mousemove', d => showTooltip(d, 'histogram', dataType))
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

function drawAxes(xScale, yScale, height, padding, monthNames) {

    d3.selectAll('.axis')
        .remove();

    let xAxis = d3.axisBottom(xScale)
                    .tickValues(monthNames);
    d3.select('.histogram__chart')
        .append('g')
            .classed('axis x-axis', true)
            .attr('transform', `translate(0, ${height - 3 * padding / 4})`)
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
            .attr('transform', `translate(${3* padding / 4}, 0)`)
            .call(yAxis)



}