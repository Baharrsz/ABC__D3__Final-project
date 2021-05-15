let monthToShow;

d3.queue()
  .defer(d3.csv, "owid-covid-data.csv", covidDataFormatter)
  //   .defer(
  //     d3.csv,
  //     "https://github.com/owid/covid-19-data/blob/master/public/data/owid-covid-data.csv",
  //     covidDataFormatter
  //   )
  .defer(d3.csv, "countries_codes_and_coordinates.csv", codeDataFormatter)
  .defer(
    d3.json,
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
  )
  .await((error, covidData, countryCodes, mapData) => {
    if (error) console.log(error);

    let allMonthsData = getMonthsData(covidData);
    addNumericCode(allMonthsData, countryCodes);

    let months = Object.keys(allMonthsData).sort();
    monthToShow = months[0];
    let dataType = "cases";

    const { innerWidth: sWidth, innerHeight: sHeight } = window;
    const sizes = {
      map: {
        width: sWidth * 0.4,
        height: sHeight * 0.5,
        padding: sWidth * 0.04,
      },
      pie: {
        width: sWidth * 0.4,
        height: sHeight * 0.5,
        padding: sWidth * 0.1,
        radHeightRatio: 0.3,
      },
      histogram: {
        width: sWidth * 0.35,
        height: sHeight * 0.5,
        padding: sWidth * 0.05,
      },
      scatter: {
        width: sWidth * 0.35,
        height: sHeight * 0.5,
        padding: sWidth * 0.05,
      },
    };

    setChart("map", dataType, allMonthsData, sizes);
    setChart("pie", dataType, allMonthsData, sizes);
    setChart("histogram", dataType, allMonthsData, sizes);
    setChart("scatter", dataType, allMonthsData, sizes);

    let monthCovidAndGeoData = drawMap(
      allMonthsData,
      mapData,
      monthToShow,
      dataType,
      sizes
    );
    drawPie(allMonthsData, monthToShow, dataType, sizes);
    drawScatter(allMonthsData, monthToShow, dataType, sizes);

    d3.select(".month-picker__input")
      .property("max", months.length - 1)
      .on("change", () => {
        monthToShow = months[d3.event.target.value];
        d3.select(".month-picker__label").text(monthToShow);

        drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
        drawPie(allMonthsData, monthToShow, dataType, sizes);
        drawScatter(allMonthsData, monthToShow, dataType, sizes);
      });

    d3.selectAll(".data-picker__input").on("change", () => {
      dataType = d3.event.target.value;
      drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
      drawPie(allMonthsData, monthToShow, dataType, sizes);
      drawScatter(allMonthsData, monthToShow, dataType, sizes);

      let { id, name } = activeCountry(monthCovidAndGeoData);
      if (id) drawHistogram(allMonthsData, id, name, dataType, sizes);
    });

    let animation;
    d3.select(".month-picker__btn").on("click", () => {
      if (d3.event.target.className.indexOf("play") >= 0) {
        animation = playAllMonths(
          allMonthsData,
          mapData,
          sizes,
          months,
          dataType,
          animation
        );
      } else stopPlay(animation);
    });
  });

/** Extracts required keys from the data.
 *
 * @param {object} row a row in the csv.
* @returns {array}  [daily data of a country]   
                    [{
                        name,
                        isoCode,
                        continent,
                        date,
                        cases,
                        casesPerMil,
                        totalCases,
                        deaths,
                        deathsPerMil,
                        totalDeaths,
                        population,
                        medianAge,
                        devIndex,
                        vaccines
                    }]
    Values are either strings or numbers. If value was missing, it will be undefined or NaN respectively.
 */
function covidDataFormatter(row, idx, headers) {
  removeList = [
    "Asia",
    "Africa",
    "Europe",
    "European Union",
    "International",
    "North America",
    "Oceania",
    "South America",
    "World",
  ];
  if (removeList.indexOf(row.location) > -1) return;

  return {
    name: read(row.location),
    isoCode: read(row.iso_code),
    continent: read(row.continent),
    date: read(row.date),
    cases: +read(row.new_cases),
    casesPerMil: +read(row.new_cases_per_million),
    totalCases: +read(row.total_cases),
    deaths: +read(row.new_deaths),
    deathsPerMil: +read(row.new_deaths_per_million),
    totalDeaths: +read(row.total_deaths),
    population: +read(row.population),
    medianAge: +read(row.median_age),
    devIndex: read(row.human_development_index),
    vaccines: +read(row.total_vaccinations_per_hundred),
  };
}

//Just a shortcut to be used in covidDataFormatter()
function read(header) {
  return header.length === 0 ? undefined : header;
}

function codeDataFormatter(row) {
  let zeroNum = 3 - row["Numeric code"].length;
  if (zeroNum === 1) row["Numeric code"] = "0" + row["Numeric code"];
  if (zeroNum === 2) row["Numeric code"] = "00" + row["Numeric code"];

  return {
    alphaCode: row["Alpha-3 code"],
    numericCode: row["Numeric code"],
    name: row["Country"],
  };
}

/** Turns daily data to monthly data. 
 * 
 * @param {array} covidData Returned value of covidDataFormatter.
 * @returns {array} [{month: monthData}]
                    monthData [
                        name,
                        isoCode,
                        continent,
                        date,
                        cases,
                        casesPerMil,
                        deaths,
                        deathsPerMil,
                        population,
                        medianAge,
                        devIndex,
                        vaccines
                    ]
                    Values of cases, casesPerMil, deaths, and deathsPerMil are accumalation of values for the whole month.
 */
function getMonthsData(covidData) {
  let monthsData = {};
  covidData.forEach((row, idx) => {
    let month = row.date.slice(0, 7);
    if (!monthsData[month]) monthsData[month] = [];
    let foundCountry = monthsData[month].find((obj) => obj.name === row.name);
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
        vaccines: row.vaccines,
      };
      monthsData[month].push(countryObj);
    } else {
      foundCountry.cases = add(row, foundCountry, "cases");
      foundCountry.casesPerMil = add(row, foundCountry, "casesPerMil");
      foundCountry.deaths = add(row, foundCountry, "deaths");
      foundCountry.deathsPerMil = add(row, foundCountry, "deathsPerMil");
    }
  });

  return monthsData;
}

//Just a shortcut to be used in getMonthsData()
function add(row, foundCountry, header) {
  return !isNaN(row[header])
    ? (foundCountry[header] || 0) + row[header]
    : undefined;
}

function addNumericCode(allMonthsData, countryCodes) {
  Object.keys(allMonthsData).forEach((month) => {
    allMonthsData[month].forEach((country) => {
      let found = countryCodes.find(
        (ctry) => ctry.alphaCode === country.isoCode
      );
      if (found) {
        country.numericCode = found.numericCode;
      }
    });
  });
}

function showTooltip(d, chartType, dataType) {
  let html;

  if (chartType === "map") {
    let population = isNaN(d.properties.population)
      ? "NA"
      : d3.format(",")(d.properties.population);
    let cases = isNaN(d.properties.casesPerMil)
      ? "NA"
      : d.properties.casesPerMil.toFixed(2);
    let deaths = isNaN(d.properties.deathsPerMil)
      ? "NA"
      : d.properties.deathsPerMil.toFixed(2);
    let vaccines = isNaN(d.properties.vaccines)
      ? "NA"
      : d3.format(",")(d.properties.vaccines);
    html = `
                <p class="tooltip__name">${d.properties.name}</p>
                <p>Population: ${population}</p>
                <p>New Cases per Million: ${cases}</p>
                <p>New Deaths per Million: ${deaths}</p>
                <p>New vaccines per Hundred: ${vaccines}</p>
            `;
  }

  if (chartType === "pie") {
    let data = isNaN(d.data[dataType])
      ? "NA"
      : d3.format(",")(d.data[dataType]);
    html = `
                <p>${d.data.name}</p>
                <p>${data} ${dataType}</p>
            `;
  }

  if (chartType === "histogram") {
    html = `<p>${d3.format(",")(d[dataType])} new ${dataType}</p>`;
  }

  if (chartType === "scatter") {
    let population = isNaN(d.population)
      ? "NA"
      : (d.population / 1e6).toFixed(2);
    let dataPerMil = isNaN(d[dataType]) ? "NA" : d[dataType].toFixed(2);
    let dataText =
      dataType === "casesPerMil" ? "Cases Per Million" : "Deaths Per Million";
    let vaccines = isNaN(d.vaccines) ? "NA" : d3.format(",")(d.vaccines);
    html = `
                <p class="tooltip__name">${d.name} </p>
                <p>Population: ${population} Million</p>
                <p>New ${dataText}: ${dataPerMil}</p>
                <p>New vaccines per hundred: ${vaccines}</p>
                <p>Median Age: ${d.medianAge}</p>
                <p>Development Index: ${d.devIndex}</p>
            `;
  }

  d3.select(".tooltip")
    .style("opacity", 1)
    .style("top", `${d3.event.pageY}px`)
    .style("left", `${d3.event.pageX}px`)
    .html(html);
}

function hideTooltip(d) {
  d3.select(".tooltip").style("opacity", 0);
}

function setChart(chartType, dataType, allMonthsData, sizes) {
  let { width, height, padding } = sizes[chartType];

  d3.select(`.${chartType}__chart`).attr("width", width).attr("height", height);

  d3.select(`.${chartType}__chart`)
    .append("text")
    .classed(`${chartType}__title charts__title`, true)
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("alignment-baseline", "hanging")
    .attr("y", 0.04 * height)
    .attr("textLength", width - (padding || 0))
    .attr("lengthAdjust", "spacingAndGlyphs");

  d3.select(`.${chartType}__chart`)
    .append("g")
    .classed(`${chartType}__main`, true);

  if (chartType === "map") createMapLegend(sizes.map, dataType);
  if (chartType === "pie") {
    d3.select(".pie__main").attr(
      "transform",
      `translate(${width / 2}, ${height / 2})`
    );

    createPieLegend(sizes.pie);
  }
  if (chartType === "scatter")
    createScatterLegend(allMonthsData, sizes.scatter);
  if (chartType === "histogram") setChartTitle("histogram");
}

function setChartTitle(chartType, dataType, monthToShow) {
  let titleType;
  switch (chartType) {
    case "map":
      titleType = "per Million Population, ";
      break;
    case "pie":
      titleType = "Worldwide, ";
      break;
    case "scatter":
      titleType = "vs Median Age, ";
      break;
    case "histogram":
      d3.select(`.${chartType}__title`)
        .text("Click on a country in the map to see monthly data")
        .attr("y", "50%");
      return;
  }

  d3.select(`.${chartType}__title`).text(
    `${
      dataType === "cases" ? "New Cases of Covid" : "New Deaths"
    } ${titleType} ${monthToShow}`
  );
}

function playAllMonths(
  allMonthsData,
  mapData,
  sizes,
  months,
  dataType,
  animation
) {
  toggle("play");

  let pickerBar = d3.select(".month-picker__input");
  let monthLabel = d3.select(".month-picker__label");
  let i = +pickerBar.property("value") + 1;

  animation = setInterval(() => {
    if (i === months.length) {
      monthToShow = months[i - 1];
      stopPlay(animation);
    } else {
      monthToShow = months[i];
      pickerBar.property("value", i);
      monthLabel.text(monthToShow);

      drawMap(allMonthsData, mapData, monthToShow, dataType, sizes);
      drawPie(allMonthsData, monthToShow, dataType, sizes);
      drawScatter(allMonthsData, monthToShow, dataType, sizes);
      i++;
    }
  }, 1000);

  return animation;
}

function stopPlay(animation) {
  toggle("pause");
  clearInterval(animation);
}

function toggle(mode) {
  if (mode === "play") {
    var other = "pause";
    var disable = true;
  } else {
    var other = "play";
    var disable = false;
  }

  d3.select(".month-picker__btn").classed(mode, false).classed(other, true);

  d3.selectAll(".data-picker *").property("disabled", disable);
  d3.select(".month-picker__input").property("disabled", disable);
}

function activeCountry(monthCovidAndGeoData) {
  let id = d3.select(".active").empty()
    ? undefined
    : d3.select(".active").attr("id").slice(1);
  let name;
  if (id)
    name = monthCovidAndGeoData.find((country) => country.id === id).properties
      .name;
  return { id, name };
}
