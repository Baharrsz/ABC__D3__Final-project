function drawPie(allMonthsData, monthToShow, dataToShow){
    const width = 500;
    const height = 500;

    let monthData = allMonthsData[monthToShow];
    console.log('monthData', monthData)


    d3.select('.pie__chart')
            .attr('width', width)
            .attr('height', height)
        .append('g')
            .classed('arcs', true)
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

    let pieGen = d3.pie()
                        .value(monthData, d => d[dataToShow])
}