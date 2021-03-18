function drawMap(allMonthsData, mapData, monthToShow, dataToShow) {
    const width = 650;
    const height = 400;
    const projectionScale = 100;

    let monthData = allMonthsData[monthToShow];
    dataToShow = (dataToShow === 'cases')? 'casesPerMil': 'deathsPerMil';

    let clrScale;
        if (dataToShow === 'casesPerMil') {
            clrScale = d3.scaleLinear()
                            .domain([0,2500])
                            .range(['lightgrey', '#730e0e']);
        } else if (dataToShow === 'deathsPerMil'){
            clrScale = d3.scaleLinear()
                            .domain([0,100])
                            .range(['lightgrey', '#0c326b']);
        }
        
                
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
                        .attr('width', width)
                        .attr('height', height)
                    .selectAll('.country')
                        .data(geoData)

    countries
        .enter()
            .append('path')
            .classed('country', true)
        .merge(countries)
            .attr('d', path)
            .on('mousemove', (d) => showTooltip(d,'map'))
            .on('mouseout', hideTooltip)
            .transition()
                .duration(500)
                .attr('fill', d => {
                if (d.properties[dataToShow] === undefined) return 'grey';
                return clrScale(d.properties[dataToShow])})

    d3.select('.map__title')
        .html(`
            <span>${(dataToShow === 'casesPerMil')? 'New Cases of Covid' : 'New Deaths'} per Million Population, </span>
            <span>${monthToShow}</span>
        `)
}

