function drawScatter(allMonthsData, monthToShow, dataType, sizes) {
    const monthData = allMonthsData[monthToShow];

    setChartTitle('scatter', dataType, monthToShow);

    dataType = (dataType === 'cases')? 'casesPerMil': 'deathsPerMil';


    const xScale = setScatterScale(allMonthsData, sizes.scatter, 'x', dataType, 0);
    const yScale = setScatterScale(allMonthsData, sizes.scatter, 'y', 'medianAge');
    const rScale = setScatterScale(allMonthsData, sizes.scatter, 'r', 'vaccines', 0);
    const fScale = setScatterScale(allMonthsData, sizes.scatter, 'f', 'devIndex');

    drawScatterAxes(xScale, yScale, sizes.scatter, dataType);

    let circles = d3.select('.scatter__main')
                    .selectAll('circle')
                        .data(monthData, d => d.name);
    circles
        .exit()
        .remove();

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
            .attr('cy', d => yScale(d.medianAge));

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
    })

    if (min === undefined) {
        min = Infinity;
        Object.keys(allMonthsData).forEach(month => {
            allMonthsData[month].forEach(country => {
                if (country[key] === 0) return;
                if (country[key] < min) min = country[key];
            })
        })
    }

    return d3.scaleLinear()
                    .domain([min, max])
                    .range(scope);

}

function drawScatterAxes(xScale, yScale, scatterSizes, dataType) {
    const {height, padding} = scatterSizes;

    d3.select('.scatter__chart')
        .selectAll('.axis')
        .remove();

    //x-Axis: Create and Call Axis
    const xAxis = d3.axisBottom(xScale)
                        .tickFormat(d3.format(".2s"));
    d3.select('.scatter__chart')
        .append('g')
            .classed('scatter__axis scatter__axis--x axis axis--x', true)
            .attr('transform', `translate(0, ${height - padding / 2})`)
            .call(xAxis);

    //x-Axis: Label        
    d3.select('.scatter__axis--x')
        .append('text')
            .classed('axis__label', true)
            .attr('x', '50%')
            .attr('y', padding / 2)
            .text(`New ${dataType.slice(0,5)}`); 

    //y-Axis: Create and Call Axis
    const yAxis = d3.axisLeft(yScale);
    d3.select('.scatter__chart')
        .append('g')
            .classed('scatter__axis scatter__axis--y axis axis--y', true)
            .attr('transform', `translate(${padding / 2}, 0)`)
            .call(yAxis);  
    
    //y-Axis: Lebel
    d3.select('.scatter__axis--y')
        .append('text')
            .classed('axis__label', true)
            .attr('x', '-50%')
            .attr('y', - padding / 3)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text('Median Age');            

}

function createScatterLegend(allMonthsData, scatterSizes) {
    const paddings = {
        x: 20,
        y: 35
    };


    let vacExtremities = scatterLegendVac(allMonthsData, scatterSizes, paddings);
    let devExtremities = scatterLegendDev(allMonthsData, scatterSizes, paddings);
    let minX = Math.min(vacExtremities.minX, devExtremities.minX);
    let minY = Math.min(vacExtremities.minY, devExtremities.minY);
    let maxX = Math.max(vacExtremities.maxX, devExtremities.maxX);
    let maxY = Math.max(vacExtremities.maxY, devExtremities.maxY);

    d3.select('.scatter__legend')
        .attr('width', maxX - minX)
        .attr('height', maxY - minY + paddings.y);
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
            .attr('x', 0)
            .attr('y', 2 * paddings.y)
            .text('New Vaccines per 100:');

    let textBox = vac.node().getBBox();
    vac
        .append('circle')
            .attr('cx', textBox.x + textBox.width + paddings.x)
            .attr('cy', textBox.y + textBox.height / 2)
            .attr('r', vacRadii[0])
            .attr('fill', 'grey');

    vac
        .append('text')
            .attr('x', textBox.x + textBox.width + paddings.x)
            .attr('y', textBox.y + textBox.height / 2 + vacRadii[0] + 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.7em')
            .text(0);

    vac
        .append('circle')
            .attr('cx', textBox.x+ textBox.width  + 3 * paddings.x + vacRadii[1])
            .attr('cy', textBox.y + textBox.height / 2)
            .attr('r', vacRadii[1])
            .attr('fill', 'grey')
    vac
        .append('text')
            .attr('x', textBox.x+ textBox.width  + 3 * paddings.x + vacRadii[1])
            .attr('y', textBox.y + textBox.height / 2 + vacRadii[1] + 10)
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
            .attr('x', 0)
            .attr('y', paddings.y)
            .attr('alignment-baseline', 'hanging')
            .text('Development Index:');

    let textBox = d3.select('.vaccine__text').node().getBBox();
    dev
        .append('rect')
            .classed('devIdx__bar', true)
            .attr('x', textBox.x + textBox.width + paddings.x)
            .attr('y', textBox.y + textBox.height / 2 - paddings.y)
            .attr('width', textBox.width * 0.7)
            .attr('height', textBox.height)
            .attr('fill', 'url(#dev-grad)');

    let barBox = d3.select('.devIdx__bar').node().getBBox();
    dev
        .append('text')
            .attr('x', barBox.x)
            .attr('y', barBox.y - 1)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.7em')
            .text(devRange[0].toFixed(1));
    dev
        .append('text')
            .attr('x', barBox.x + barBox.width)
            .attr('y', barBox.y - 1)
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