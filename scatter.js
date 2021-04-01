function drawScatter(allMonthsData, monthToShow, dataType, sizes) {
    const {width, height, padding} = sizes.scatter;
    const monthData = allMonthsData[monthToShow];

    dataType = (dataType === 'cases')? 'casesPerMil': 'deathsPerMil';


    const xScale = setScatterScale(allMonthsData, sizes.scatter, 'x', dataType, 0);
    const yScale = setScatterScale(allMonthsData, sizes.scatter, 'y', 'medianAge');
    const rScale = setScatterScale(allMonthsData, sizes.scatter, 'r', 'vaccines', 0);
    const fScale = setScatterScale(allMonthsData, sizes.scatter, 'f', 'devIndex');

    drawScatterAxes(xScale, yScale, sizes.scatter);

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

function setScatterScale(allMonthsData, scatterSizes, dimension, key, min) {
    const {width, height, padding} = scatterSizes;
    let scope;
    switch (dimension) {
        case 'x':
            scope = [padding, width - padding];
            break;
        case 'y':
            scope = [height - padding, padding];
            break;
        case 'r':
            scope = [5, 20];
            break;
        case 'f': 
            scope = ['#f0d13a', '#3497ed'];
    }

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
    const {height, padding} = sizes;

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

function createScatterLegend(allMonthsData, scatterSizes) {
    const paddings = {
        x: 20,
        y: 40
    };


    let vacExtremities = scatterLegendVac(allMonthsData, scatterSizes, paddings);
    let devExtremities = scatterLegendDev(allMonthsData, scatterSizes, paddings);
    let minX = Math.min(vacExtremities.minX, devExtremities.minX);
    let minY = Math.min(vacExtremities.minY, devExtremities.minY);
    let maxX = Math.max(vacExtremities.maxX, devExtremities.maxX);
    let maxY = Math.max(vacExtremities.maxY, devExtremities.maxY);

    d3.select('.scatter__legend')
        .attr('width', maxX - minX + 2 * paddings.x)
        .attr('hieght', maxY - minY + 2 * paddings.y)
}

function scatterLegendVac(allMonthsData, scatterSizes, paddings) {
    const vacRadii = setScatterScale(allMonthsData, scatterSizes,'r', 'vaccines', 0).range();
    const vacRange = setScatterScale(allMonthsData, scatterSizes,'r', 'vaccines', 0).domain();

    let vac = d3.select('.scatter__legend')
                    .append('g')
                        .classed('legend__vaccine vaccine', true);

    vac
        .append('text')
            .classed('vaccine__text', true)
            .attr('x', paddings.x)
            .attr('y', 2.5 * paddings.y)
            .attr('font-size', '0.8em')
            .text('New Vaccines per 100:');

    let textBox = vac.node().getBBox();
    vac
        .append('circle')
            .attr('cx', textBox.x + textBox.width + paddings.x)
            .attr('cy', 2 * paddings.y)
            .attr('r', vacRadii[0])
            .attr('fill', 'grey')
    vac
        .append('text')
            .attr('x', textBox.x + textBox.width + paddings.x)
            .attr('y', 3 * paddings.y)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.7em')
            .text(0)

    vac
        .append('circle')
            .attr('cx', textBox.x+ textBox.width  + 3 * paddings.x + vacRadii[1])
            .attr('cy', 2 * paddings.y)
            .attr('r', vacRadii[1])
            .attr('fill', 'grey')
    vac
        .append('text')
            .attr('x', textBox.x+ textBox.width  + 3 * paddings.x + vacRadii[1])
            .attr('y', 3 * paddings.y)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.7em')
            .text(vacRange[1]);

    let {x, y, width, height} = vac.node().getBBox();
    return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height
    }
}

function scatterLegendDev(allMonthsData, scatterSizes, paddings) {
    const devColors = setScatterScale(allMonthsData, scatterSizes,'f', 'devIndex').range();
    const devRange = setScatterScale(allMonthsData, scatterSizes,'f', 'devIndex').domain();


    d3.select('.scatter__legend')
        .append('defs')
            .html(`
                <linearGradient id="dev-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="${devColors[0]}"/>
                    <stop offset="100%" stop-color="${devColors[1]}"/>
                </linearGradient>
                `);


    let dev = d3.select('.scatter__legend')
                .append('g')
                    .classed('legend__devIdx devIdx', true);
    dev
        .append('text')
            .classed('devIdx__text', true)
            .attr('x', paddings.x)
            .attr('y', paddings.y)
            .attr('font-size', '0.8em')
            .text('Development Index:');

    let textBox = d3.select('.vaccine__text').node().getBBox();
    dev
        .append('rect')
            .classed('devIdx__bar', true)
            .attr('x', textBox.x + textBox.width + paddings.x)
            .attr('y', paddings.y / 2)
            .attr('width', textBox.width)
            .attr('height', textBox.height)
            .attr('fill', 'url(#dev-grad)');

    let barBox = d3.select('.devIdx__bar').node().getBBox();
    dev
        .append('text')
            .attr('x', barBox.x)
            .attr('y', barBox.y + barBox.height + 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.7em')
            .text(devRange[0].toFixed(1));
    dev
        .append('text')
            .attr('x', barBox.x + barBox.width)
            .attr('y', barBox.y + barBox.height + 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.7em')
            .text(devRange[1].toFixed(1));

    let {x, y, width, height} = dev.node().getBBox();
    return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height
    }
}