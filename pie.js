function drawPie(allMonthsData, monthToShow, dataType, sizes){
    const {width, height, radHeightRatio} = sizes.pie;
    const monthData = allMonthsData[monthToShow];

    setChartTitle('pie', dataType, monthToShow);

    let pieGen = d3.pie()
                        .value(d => d[dataType])
                        .sort((a, b) => {
                            if (a.continent < b.continent) return -1;
                            if (a.continent > b.continent) return 1;
                        });
    let arcsArr = pieGen(monthData);

    let arcs = d3.select('.pie__main')
                .selectAll('.arc')
                    .data(arcsArr);

    let pathGen = d3.arc()
                        .outerRadius(radHeightRatio * height)
                        .innerRadius(0);                       

    arcs
        .exit()
        .remove();

    arcs
        .enter()
        .append('path')
            .classed('arc', true)
        .merge(arcs)
            .attr('d', pathGen)
            .attr('fill', d => setPieScale(monthData)(d.data.continent))
            .style('stroke', 'white')
            .style('stroke-width', 0.1)
            .on('mousemove', (d) => showTooltip(d,'pie', dataType))
            .on('mouseout', hideTooltip)
                    
}

function setPieScale() {
    const colours = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33'];
    const continents = ["Asia", "Africa", "Europe", "Oceania", "North America", "South America"]


    let scale = d3.scaleOrdinal()
                    .domain(continents)
                    .range(colours);

    return scale;
}

function createPieLegend(pieSizes){
    const scale = [],
        {width} = pieSizes,
        dimensions = {
            padding: width / 40 ,
            circlesRad : width / 100
        } 

    setPieScale().domain().forEach(continent => scale.push({
        continent: continent,
        colour: setPieScale()(continent)
    }))


    let legend = d3.select('.pie__legend');

    legend
        .selectAll('.legend__cirlce')
            .data(scale)
        .enter()
        .append('circle')
            .classed('legend__circle', true)
            .attr('r', dimensions.circlesRad)
            .attr('cx', dimensions.padding)
            .attr('cy', (d, idx) => dimensions.padding * (1 + idx))
            .attr('fill', d => d.colour)
            .attr('text', d => d.continent);

    legend
        .selectAll('.legend__text')
            .data(scale)
        .enter()
        .append('text')
            .classed('legend__text', true)
            .text(d => d.continent)
            .attr('x', dimensions.padding * 2)
            .attr('y', (d, idx) => dimensions.padding * (1 + idx))
            .attr('alignment-baseline', 'middle')
            .style('font-size', '0.8em');

    let {y, width: w, height: h} = d3.select('.legend__text:last-child').node().getBBox();
    legend
        .attr('width', w + 3 * dimensions.padding + dimensions.circlesRad)
        .attr('height', y + h + dimensions.padding)

}
