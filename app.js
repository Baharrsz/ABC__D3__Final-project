d3.queue()
    .defer(d3.csv, "data/covid-data.csv", formatter)
    .await((error, data) => {
        let monthsData = getMonths(data);

    

    })



function formatter(row, idx, headers){
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
        totalCases: +row.total_cases,
        newCases: +row.new_cases,
        totalDeaths: +row.total_deaths,
        newDeaths: +row.new_deaths,
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
                    newCases: row.newCases,
                    newDeaths: row.newDeaths,
                    population: row.population,
                    medianAge: row.medianAge,
                    devIndex: row.devIndex
                }
                monthsData[month].push(countryObj)
            } else {
                foundCountry.newCases += row.newCases;
                foundCountry.newDeaths += row.newDeaths;
            }
        })

        return monthsData;

}