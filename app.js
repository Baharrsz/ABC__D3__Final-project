d3.queue()
    .defer(d3.csv, "data/covid-data.csv", formatter)
    .await((error, data) => {
        console.log(data);
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
