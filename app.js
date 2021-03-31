d3.queue()
    .defer(d3.csv, 'data/covid-data.csv', covidDataFormatter)
    .defer(d3.csv, 'data/countries_codes_and_coordinates.csv', codeDataFormatter)
    .defer(d3.json, 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
    .await((error, covidData, countryCodes, mapData) => {
        if (error) console.log(error);

        let allMonthsData = getMonthsData(covidData);
        addNumericCode(allMonthsData, countryCodes);
        console.log(allMonthsData);

        let months = Object.keys(allMonthsData).sort();
        let monthToShow = months[0];
        let dataType = 'cases';
        
        const {width: sWidth, height: sHeight} = window.screen;
        const sizes = {
            map: {width: sWidth * 0.5, height: sHeight * 0.5},
            pie: {width:sWidth * 0.5, height: sHeight * 0.3, radHeightRatio: 0.5},
            histogram: {width:sWidth * 0.4, height: sHeight * 0.35, padding: sWidth * 0.04},
            scatter: {width: sWidth * 0.4, height: sHeight * 0.5, padding: sWidth * 0.04}
        }

        setChart('map', sizes, dataType, monthToShow);
        setChart('pie', sizes, dataType, monthToShow);
        setChart('histogram', sizes, dataType);
        setChart('scatter', sizes, monthToShow);

        drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
        drawPie(allMonthsData, monthToShow, dataType, sizes);
        drawScatter(allMonthsData,monthToShow, dataType, sizes);
        
        d3.select('.month-picker__input')
            .property('max', months.length - 1)
            .on('change', () => {
                monthToShow = months[d3.event.target.value];
                d3.select('.month-picker__label').text(monthToShow);
                
                drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
                drawPie(allMonthsData, monthToShow, dataType, sizes);
                drawScatter(allMonthsData,monthToShow, dataType, sizes);

            });
            
        d3.selectAll('.data-picker__input')
        .on('change', () => {
            dataType = d3.event.target.value;
            drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
            drawPie(allMonthsData, monthToShow, dataType, sizes);
            drawScatter(allMonthsData,monthToShow, dataType, sizes);

            let activeId = (d3.select('.active').empty())? undefined : d3.select('.active').attr('id');            
            if (activeId) drawHistogram(allMonthsData, activeId, dataType, sizes); 
        });

        let animation;
        d3.select('.month-picker__btn')
            .on('click', () => {
                if (d3.event.target.className.indexOf('play') >= 0) {
                    animation = playAllMonths(allMonthsData, mapData, dataType, sizes, months, animation)
                } else stopPlay(animation);
            });

    });

        



function covidDataFormatter(row, idx, headers){
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
    ];
    if (removeList.indexOf(row.location) > -1) return;

    return {
        name: row.location,
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
        devIndex: +row.human_development_index,
        vaccines: +row.total_vaccinations_per_hundred
    };
}

function codeDataFormatter(row) {

    let zeroNum = 3 - row['Numeric code'].length;
    if (zeroNum === 1)row['Numeric code'] = "0" + row['Numeric code'];
    if (zeroNum === 2)row['Numeric code'] = "00" + row['Numeric code'];

    return {
        alphaCode: row['Alpha-3 code'],
        numericCode: row['Numeric code']
    };
}

function getMonthsData(covidData) {
    let monthsData = {};
    covidData.forEach((row, idx) => {
        let month = row.date.slice(0, 7);
        if (!monthsData[month]) monthsData[month] = [];
        let foundCountry = monthsData[month].find(obj => obj.name === row.name);
        if (!foundCountry) {
            let countryObj = {
                name: row.name,
                isoCode: row.isoCode,
                continent: row.continent,
                cases: row.cases,
                casesPerMil: row.casesPerMil,
                deaths: row.deaths,
                deathsPerMil: row.deathsPerMil,
                population: row.population,
                medianAge: row.medianAge,
                devIndex: row.devIndex,
                vaccines: row.vaccines

            }
            monthsData[month].push(countryObj)
        } else {
            foundCountry.cases += row.cases;
            foundCountry.casesPerMil += row.casesPerMil;
            foundCountry.deaths += row.deaths;
            foundCountry.deathsPerMil += row.deathsPerMil;
        }
    });

    return monthsData;

}

function addNumericCode(allMonthsData, countryCodes) {
    Object.keys(allMonthsData).forEach(month => {
        allMonthsData[month].forEach(country => {
            let found = countryCodes.find(ctry => ctry.alphaCode === country.isoCode);
            if (found) {
                country.numericCode = found.numericCode}
        })
    });
}

function showTooltip(d, chart, dataType) {
    let html;

    if (chart === 'map') {
        let population = (isNaN(d.properties.population))? 'NA': d3.format(',')(d.properties.population);
        let cases = (isNaN(d.properties.casesPerMil))? 'NA': d.properties.casesPerMil.toFixed(2);
        let deaths = (isNaN(d.properties.deathsPerMil))? 'NA': d.properties.deathsPerMil.toFixed(2);
        let vaccines = (isNaN(d.properties.vaccines))? 'NA': d3.format(',')(d.properties.vaccines);
        html = `
                <p class="tooltip__name>${d.properties.name}</p>
                <p>Population: ${population}</p>
                <p>New Cases per Million: ${cases}</p>
                <p>New Deaths per Million: ${deaths}</p>
                <p>New vaccines per Hundred: ${vaccines}</p>
            `
        }

    if (chart === 'pie') {
        let data = (isNaN(d.data[dataType]))? 'NA': d3.format(',')(d.data[dataType]);
        html = `
                <p>${d.data.name}</p>
                <p>${data} ${dataType}</p>
            `
    };

    if (chart === 'histogram') {
        html = `<p>${d3.format(',')(d[dataType])} new ${dataType}</p>`
    };

    if (chart === 'scatter') {
        let population = (isNaN(d.population))? 'NA': (d.population / 1e6).toFixed(2);
        let dataPerMil = (isNaN(d[dataType]))? 'NA': d[dataType].toFixed(2);
        let dataText = (dataType === 'casesPerMil')? 'Cases Per Million' : 'Deaths Per Million'
        let vaccines = (isNaN(d.vaccines))? 'NA': d3.format(',')(d.vaccines);
        html = `
                <p class="tooltip__name">${d.name} </p>
                <p>Population: ${population} Million</p>
                <p>New ${dataText}: ${dataPerMil}</p>
                <p>New vaccines per hundred: ${vaccines}</p>
                <p>Median Age: ${d.medianAge}</p>
                <p>Development Index: ${d.devIndex}</p>
            `    };
    
    d3.select('.tooltip')
        .style('opacity', 1)
        .style('top', `${d3.event.pageY}px`)
        .style('left', `${d3.event.pageX}px`)
        .html(html);
}

function hideTooltip(d) {
    d3.select('.tooltip')
        .style('opacity', 0);
}

function setChart(chartType, sizes, dataType, monthToShow) {
    let {width, height} = sizes[chartType];

    d3.select(`.${chartType}__chart`)
        .attr('width', width)
        .attr('height', height);


    d3.select(`.${chartType}__chart`)
            .append('g')
                .classed(`${chartType}__main`, true)

    
    if (chartType === 'map') createMapLegend(sizes.map, dataType);
    if (chartType === 'pie') {
        d3.select('.pie__main')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        createPieLegend(sizes.pie);
    }
}

function playAllMonths(allMonthsData, mapData, dataType, sizes, months, animation) {

    toggle('play');

    let pickerBar = d3.select('.month-picker__input');
    let monthLabel = d3.select('.month-picker__label');

    let i = +pickerBar.property('value') + 1;

    animation = setInterval(() => {
        if (i === months.length) {
            stopPlay(animation);
        } else {
            let monthToShow = months[i];
            pickerBar.property('value', i);
            monthLabel.text(monthToShow);

            drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
            drawPie(allMonthsData, monthToShow, dataType, sizes);
            drawScatter(allMonthsData, monthToShow, dataType, sizes);
            i++;
        }
    }, 1000);
    return animation;
};

function stopPlay(animation) {
    toggle('pause');
    clearInterval(animation);
}

function toggle(mode){
    if (mode === 'play') {
        var other ='pause';
        var disable = true;
    } else {
        var other ='play';
        var disable = false;
    }
    
    d3.select('.month-picker__btn')
        .classed(mode, false)
        .classed(other, true);

    d3.selectAll('.data-picker *').property('disabled', disable);
    d3.select('.month-picker__input').property('disabled', disable);
}