function drawMap(allMonthsData, mapData, monthToShow, dataType, sizes) {
    const {width, height} = sizes.map;
    const projectionScale = width / 7;

    let monthData = allMonthsData[monthToShow];
    
    dataType = (dataType === 'cases')? 'casesPerMil': 'deathsPerMil';

    d3.select('.map__title')
    .html(`
        <span>${(dataType === 'casesPerMil')? 'New Cases of Covid' : 'New Deaths'} per Million Population, </span>
        <span>${monthToShow}</span>
    `)

    let clrScale = setScale(dataType);

                
    let geoData = topojson.feature(mapData, mapData.objects.countries).features;
    geoData.forEach(feature => {
        let found = monthData.find(country => country.numericCode === feature.id);
        if (found) feature.properties = found;
    })

    let projection = d3.geoMercator()
                        .scale(projectionScale)
                        .translate([width / 2, 0.7 * height]);
    let path = d3.geoPath()
                    .projection(projection)

    

    let countries = d3.select('.map__chart')
                    .selectAll('.country')
                        .data(geoData)

    countries
        .enter()
            .append('path')
            .classed('country', true)
            .attr('id', d => d.id)
            .attr('d', path)
        .merge(countries)
            .on('mousemove', (d) => showTooltip(d,'map'))
            .on('mouseout', hideTooltip)
            .on('click', (d) => {
                d3.select('.active')
                    .classed('active', false);
                d3.select(d3.event.target).classed('active', true);

                drawHistogram(allMonthsData, d.id, dataType.slice(0,dataType.indexOf('PerMil')), sizes)
            })
            .transition()
                .duration(500)
                .attr('fill', d => {
                if (d.properties[dataType] === undefined) return 'gray';
                return clrScale(d.properties[dataType])})


}

function setScale(dataType) {
    let clrScale;
    if (dataType === 'casesPerMil') {
        clrScale = d3.scaleLinear()
                        .domain([0,100, 2500, 50000])
                        .range(['white', '#fcd703', '#730e0e', 'black']);
    } else if (dataType === 'deathsPerMil'){
        clrScale = d3.scaleLinear()
                        .domain([0, 50, 100, 500])
                        .range(['white', '#1454de', '#580878', 'black']);
    }
    return clrScale;
}

