function drawMap(allMonthsData, mapData, monthToShow, dataType, sizes) {
    const {width, height} = sizes.map;
    const projectionScale = width * 0.15;
    const monthData = allMonthsData[monthToShow];

    setChartTitle('map', dataType, monthToShow);

    resetMap(dataType);

    dataType = (dataType === 'cases')? 'casesPerMil': 'deathsPerMil';
                
    //Add covid data to the geographic data of the countries
    let geoData = topojson.feature(mapData, mapData.objects.countries).features;
    geoData = geoData.filter(feature => feature.id !== '010');
    geoData.forEach(feature => {
        let found = monthData.find(country => country.numericCode === feature.id);
        if (found) feature.properties = found;
    })

    let projection = d3.geoMercator()
                        .scale(projectionScale)
                        .translate([width / 2, 0.7 * height]);
    let path = d3.geoPath()
                    .projection(projection);


    //Drawing the map
    let countries = d3.select('.map__main')
                        .selectAll('.country')
                            .data(geoData);
    countries
        .enter()
            .append('path')
            .classed('country', true)
            .attr('id', d => 'c' + d.id)
            .attr('d', path)
        .merge(countries)
            .on('mousemove', (d) => showTooltip(d,'map'))
            .on('mouseout', hideTooltip)
            .on('click', (d) => {
                d3.select('.active')
                    .classed('active', false);
                d3.select(d3.event.target).classed('active', true);

                drawHistogram(allMonthsData, d.id, d.properties.name, dataType.slice(0,dataType.indexOf('PerMil')), sizes)
            })
            .transition()
                .duration(500)
                .attr('fill', d => { 
                    if (d.properties[dataType] === undefined || isNaN(d.properties[dataType])) return 'gray';
                    return setMapScale(dataType)(d.properties[dataType]);
                });
    return geoData;
}

function setMapScale(dataType) {
    const casesColours = ['white', '#fcd703', '#730e0e', 'black'];
    const casesStops = [0,100, 2500, 20000];
    const deathsColours = ['white', '#1454de', '#580878', 'black'];
    const deathsStops = [0, 50, 100, 400];
    
    let clrScale;
    if (dataType.indexOf('cases') >= 0) {
        clrScale = d3.scaleLinear()
                        .domain(casesStops)
                        .range(casesColours);
    } else if (dataType.indexOf('deaths') >= 0){
        clrScale = d3.scaleLinear()
                        .domain(deathsStops)
                        .range(deathsColours);
    } else console.log('setMapScale: Invalid dataType');
    return clrScale;
}

function createMapLegend(mapSizes, dataType){
    const {width} = mapSizes,
        dimensions = {
            padding: 20,
            barWidth: 1/5 * width,
            barHeight: 1/50 * width
        },
        casesColours = setMapScale('cases').range(),
        deathsColours = setMapScale('deaths').range();
 
    d3.select('.map__legend').append('defs')
            .html(`
                <linearGradient id="cases-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="${casesColours[0]}"/>
                    <stop offset="25%"   stop-color="${casesColours[1]}"/>
                    <stop offset="50%"   stop-color="${casesColours[2]}"/>
                    <stop offset="100%" stop-color="${casesColours[3]}"/>
                </linearGradient>
                <linearGradient id="deaths-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="${deathsColours[0]}"/>
                    <stop offset="25%"   stop-color="${deathsColours[1]}"/>
                    <stop offset="50%"   stop-color="${deathsColours[2]}"/>
                    <stop offset="100%" stop-color="${deathsColours[3]}"/>
                </linearGradient>
                `)


    let legend = d3.select('.map__legend');
    legend.append('rect')
            .classed('legend__bar', true)
            .attr('x', dimensions.padding)
            .attr('y', 0)
            .attr('width', dimensions.barWidth)
            .attr('height', dimensions.barHeight)
            .attr('fill', `url('#${dataType}-grad')`);
    legend
        .append('g')
            .classed('legend__axis', true)
            .attr('transform', `translate(0, ${dimensions.barHeight})`);

    legend
        .attr('width', dimensions.barWidth + 2 * dimensions.padding)
        .attr('height', dimensions.barHeight + 2 * dimensions.padding)

}

function resetMap(dataType) {
    stops = setMapScale(dataType).domain();

    let bar = d3.select('.map__legend')
                .select('.legend__bar')
                    .attr('fill', `url('#${dataType}-grad')`);

    let x = bar.attr('x');
    let length = bar.attr('width');
    let scale = d3.scalePoint()
                    .domain(stops)
                    .range([x, +x + +length]);

    let axis = d3.axisBottom(scale);
    d3.select('.legend__axis')
        .call(axis)

}


