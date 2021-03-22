function drawHistogram(data, countryId) {
    const width = 500;
    const height = 500;
    const padding = 50;

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
                    .domain([0, d3.max(data, d => d.cases)])
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
        .merge(rects)
            .attr('x', (d, idx) => xScale(idx))
            .attr('y', d => yScale(d.cases))
            .attr('width', (width - 2 * padding) / (monthNames.length - 1))
            .attr('height', d => height - padding - yScale(d.cases))
            .attr('fill', 'black')

}