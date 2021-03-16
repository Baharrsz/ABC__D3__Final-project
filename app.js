d3.queue()
    .defer(d3.csv, 'data/covid-data.csv', cvdDataFormatter)
    .defer(d3.csv, 'data/countries_codes_and_coordinates.csv', codeDataFormatter)
    .defer(d3.json, 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
    .await((error, covidData, countryCodes, mapData) => {
        if (error) console.log(error);

        let allMonthsData = getMonths(covidData);
        console.log("All months", allMonthsData);

        let monthData = allMonthsData["2021-03"];
        monthData.forEach(location => {
            let found = countryCodes.find(country => country.alphaCode === location.isoCode);
            if (found) {
                location.numericCode = found.numericCode}
        })

        console.log('monthData', monthData)
        
        let clrScaleCase = d3.scaleLinear()
                            .domain([0,2500])
                            .range(['white', 'red'])

        let clrScaleDeath = d3.scaleLinear()
                            .domain([0,100])
                            .range(['white', 'blue'])                    
        
        let geoData = topojson.feature(mapData, mapData.objects.countries).features;

        geoData.forEach(feature => {
            let found = monthData.find(country => country.numericCode === feature.id);
            if (found) feature.properties = found;
        })
        console.log("geoData", geoData)

        let projection = d3.geoMercator()
                            .scale(75)
                            .translate([250,250]);
        let path = d3.geoPath()
                        .projection(projection)

        

        let countries = d3.select('svg')
                            .attr('width', 500)
                            .attr('height', 500)
                        .selectAll('.country')
                            .data(geoData)

        countries
            .enter()
                .append('path')
                .classed('country', true)
            .merge(countries)
                .attr('d', path)
                .attr('fill', d => {
                    if (d.properties.casesPerMil === undefined) {
                        console.log(d); 
                        return 'grey';}
                    return clrScaleDeath(d.properties.deathsPerMil)})
                


    

    })



function cvdDataFormatter(row, idx, headers){
    removeList = [
        'Asia',
        'Africa',
        'Europe',
        'European Union',
        'International',
        'North America',
        'Oceania',
        'South America',
        'World',
    ]
    if (removeList.indexOf(row.location) > -1) return;

    return {
        location: row.location,
        isoCode: row.iso_code,
        continent: row.continent,
        date: row.date,
        cases: +row.new_cases,
        casesPerMil : +row.new_cases_per_million,
        totalCases: +row.total_cases,
        deaths: +row.new_deaths,
        deathsPerMil: +row.new_deaths_per_million,
        totalDeaths: +row.total_deaths,
        population: +row.population,
        medianAge: +row.median_age,
        devIndex: +row.human_development_index
    }
    
}

function getMonths(data) {
        let monthsData = {};
        data.forEach((row, idx) => {
            let month = row.date.slice(0, 7);
            if (!monthsData[month]) monthsData[month] = [];
            let foundCountry = monthsData[month].find(obj => obj.location === row.location);
            if (!foundCountry) {
                let countryObj = {
                    location: row.location,
                    isoCode: row.isoCode,
                    continent: row.continent,
                    cases: row.cases,
                    casesPerMil: row.casesPerMil,
                    deaths: row.deaths,
                    deathsPerMil: row.deathsPerMil,
                    population: row.population,
                    medianAge: row.medianAge,
                    devIndex: row.devIndex
                }
                monthsData[month].push(countryObj)
            } else {
                foundCountry.cases += row.cases;
                foundCountry.casesPerMil += row.casesPerMil;
                foundCountry.deaths += row.deaths;
                foundCountry.deathsPerMil += row.deathsPerMil;
            }
        })

        return monthsData;

}

function codeDataFormatter(row) {

    let zeroNum = 3 - row['Numeric code'].length;
    if (zeroNum === 1)row['Numeric code'] = "0" + row['Numeric code'];
    if (zeroNum === 2)row['Numeric code'] = "00" + row['Numeric code'];

    return {
        alphaCode: row['Alpha-3 code'],
        numericCode: row['Numeric code']
    }
}