function drawScatter(allMonthsData, monthToShow, dataType, sizes) {
    const {width, height, padding} = sizes.scatter;
    const monthData = allMonthsData[monthToShow];

    dataType = (dataType === 'cases')? 'casesPerMil': 'deathsPerMil';


    const xScale = setScatterScale(allMonthsData, dataType, [padding, width - padding], 0);
    const yScale = setScatterScale(allMonthsData, 'medianAge', [height - padding, padding]);
    const rScale = setScatterScale(allMonthsData, 'vaccines', [5, 20], 0);
    const fScale = setScatterScale(allMonthsData, 'devIndex', ['#f0d13a', '#3497ed']);

    drawScatterAxes(xScale, yScale, sizes.scatter);

    

    console.log(yScale.domain(), yScale.range(), yScale(15.1))



    let circles = d3.select('.scatter__main')
                    .selectAll('circle')
                        .data(monthData, d => d.name);
    circles
        .exit()
        .remove()


    circles
        .enter()
        .append('circle')
            .classed('scatter__circle', true)
            .attr('cx', d => xScale(d[dataType]))
            .attr('cy', d => yScale(d.medianAge))
            .attr('fill', d => fScale(d.devIndex))
            .attr('stroke', 'grey')
        .merge(circles)
        .on('mouseover', (d) => showTooltip(d, 'scatter', dataType))
        .on('mouseout', hideTooltip)
        .transition()
            .duration(1000)
            .attr('r', d => rScale(d.vaccines))
            .attr('cx', d => xScale(d[dataType]))
            .attr('cy', d => yScale(d.medianAge))


}

function setScatterScale(allMonthsData, key, scope, min) {
    let max = 0;
    Object.keys(allMonthsData).forEach(month => {
        allMonthsData[month].forEach(country => {
            if (country[key] > max) max = country[key];
        })
    });

    if (min === undefined) {
        min = Infinity;
        Object.keys(allMonthsData).forEach(month => {
            allMonthsData[month].forEach(country => {
                if (country[key] === 0) return;
                if (country[key] < min) min = country[key];
            })
        })
    };

    return d3.scaleLinear()
                    .domain([min, max])
                    .range(scope);

}

function drawScatterAxes(xScale, yScale, sizes) {
    const {width, height, padding} = sizes;

    d3.select('.scatter__chart')
        .selectAll('.axis')
        .remove()


    const xAxis = d3.axisBottom(xScale);
    d3.select('.scatter__chart')
        .append('g')
            .classed('axis x-axis', true)
            .attr('transform', `translate(0, ${height - padding / 2})`)
            .call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    d3.select('.scatter__chart')
        .append('g')
            .classed('axis y-axis', true)
            .attr('transform', `translate(${padding / 2}, 0)`)
            .call(yAxis);            

}

// function setScatterChart(xScale, yScale, sizes) {

//     d3.select('.scatter__chart')
//                         .append('g')
//                             .classed('scatter__circles', true);


// }