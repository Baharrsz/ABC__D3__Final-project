function drawPie(allMonthsData, monthToShow, dataToShow){
    const width = 300;
    const height = 300;

    let monthData = allMonthsData[monthToShow];

    d3.select('.pie__chart')
            .attr('width', width)
            .attr('height', height)
        .append('g')
            .classed('pie-chart', true)
            .attr('transform', `translate(${width / 2}, ${height / 2})`);


    let scale = d3.scaleOrdinal()
                    .domain(monthData.map(country => country.continent))
                    .range(d3.schemeCategory10);


    let pieGen = d3.pie()
                        .value(d => d[dataToShow])
                        .sort((a, b) => {
                            if (a.continent < b.continent) return -1;
                            if (a.continent > b.continent) return 1;
                        });
    let arcsArr = pieGen(monthData)

    let pathGen = d3.arc()
                        .outerRadius(width / 2)
                        .innerRadius(0);
                        

    let arcs = d3.select('.pie-chart')
                .selectAll('.arc')
                    .data(arcsArr)

    arcs
        .exit()
        .remove();

    arcs
        .enter()
        .append('path')
            .classed('arc', true)
        .merge(arcs)
            .attr('d', pathGen)
            .attr('fill', d => scale(d.data.continent))
            .on('mousemove', (d) => showTooltip(d,'pie', dataToShow))
            .on('mouseout', hideTooltip)



    d3.select('.pie__title')
        .html(`
            <span>${(dataToShow === 'cases')? 'New Cases of Covid' : 'New Deaths'}, </span>
            <span>${monthToShow}</span>
        `)
                    
}

