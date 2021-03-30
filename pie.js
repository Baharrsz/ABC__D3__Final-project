function drawPie(allMonthsData, monthToShow, dataType, sizes){
    const {width, height, radHeightRatio} = sizes.pie;
    const monthData = allMonthsData[monthToShow];

    createMapTitle(dataType, monthToShow);

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
        {width, height, radHeightRatio} = pieSizes,
        positions = {
            areaWidth: 120,
            areaHeight: height *  0.5,
            x: width / 2 + (radHeightRatio * height) + 10,
            y: height * 0.5,
            paddingX: 1/8,
            paddingY: 1 / 7,
            circlesRad : 1 / 20
        } 

    setPieScale().domain().forEach(continent => scale.push({
        continent: continent,
        colour: setPieScale()(continent)
    }))


    let legend = d3.select('.pie__chart')
                    .append('g')
                        .classed('pie__legend legend', true)

    legend.append('rect')
            .classed('legend__area', true)
            .attr('x', positions.x)
            .attr('y', positions.y)
            .attr('width', positions.areaWidth)
            .attr('height', positions.areaHeight)
            .attr('stroke', 'grey')
            .attr('rx', 5)
            .attr('fill', 'white')

    legend
        .selectAll('.legend__cirlce')
            .data(scale)
        .enter()
        .append('circle')
            .classed('legend__circle', true)
            .attr('r', positions.areaHeight * positions.circlesRad)
            .attr('cx', positions.x + positions.areaWidth * positions.paddingX)
            .attr('cy', (d, idx) => positions.y + positions.areaHeight * positions.paddingY * (1 + idx))
            .attr('fill', d => d.colour)
            .attr('text', d => d.continent)

    legend
        .selectAll('.legend__text')
            .data(scale)
        .enter()
        .append('text')
            .classed('legend__text', true)
            .text(d => d.continent)
            .attr('x', positions.x + positions.areaWidth * positions.paddingX * 2)
            .attr('y', (d, idx) => positions.y + positions.areaHeight * positions.paddingY * (1 + idx))
            .attr('alignment-baseline', 'middle')
            .style('font-size', '12px')
}

function createMapTitle(dataType, monthToShow) {
        d3.select('.pie__title')
    .html(`
        <span class="title__type">${(dataType === 'cases')? 'New Cases of Covid' : 'New Deaths'} Worldwide, </span>
        <span class="title__month">${monthToShow}</span>
    `);
}
