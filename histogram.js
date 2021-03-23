function drawHistogram(data, countryId, dataType) {
    const width = 500;
    const height = 500;
    const padding = 50;

    //If the function is called from drawMap, dataType has changed to cases/deaths PerMil
    if (dataType.indexOf('PerMil') > 0) dataType = dataType.slice(0,dataType.indexOf('PerMil'))

    
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


    let xScale = d3.scaleLinear()
                    .domain([0, monthNames.length - 1])
                    .range([padding, width - padding]);

    let yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d[dataType])])
                    .range([height - padding, padding])




    let rects = d3.select('.histogram__chart')
                    .attr('width', width)
                    .attr('height', height)
                .selectAll('rect')
                    .data(data);


    rects
        .exit()
        .remove();

    rects
        .enter()
        .append('rect')
            .classed('histogram__bin', true)
            .attr('y', height - padding)
            .attr('height', 0)
        .merge(rects)
            .attr('x', (d, idx) => xScale(idx))
            .attr('width', (width - 2 * padding) / (monthNames.length - 1))
        .transition()
            .duration(400)
            .delay((d,idx) => idx * 200)
            .ease(d3.easeSin)
            .attr('y', d => yScale(d[dataType]))
            .attr('height', d => height - padding - yScale(d[dataType]))
            .attr('fill', (dataType === 'cases')? '#730e0e' : '#0c326b')

}