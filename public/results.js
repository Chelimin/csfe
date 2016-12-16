// const BASE_URL = "http://54.254.142.20"
const BASE_URL =  "http://api.catchsense.com"
console.log('asdasdasd')
function fetchQuarterPred(body) {
  return $.ajax({
    url: BASE_URL + "/v1/frontend",
    type: "POST",
    data: JSON.stringify(body),
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  }).then(res => {
    const prediction = res.result
    const project = prediction.projectPred
    const unit = prediction.unitPred
    // TODO use errors here
    const high = prediction.high
    const low = prediction.low
    return {
      quarter: body['quarter'],
      project: project,
      unit: unit
    }
  })
}

function fetchHistory(body) {
  return $.ajax({
    url: BASE_URL + "/v1/history",
    type: "POST",
    data: JSON.stringify(body),
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  }).then((response) => {
    return response.result
  })
}

function fetchPropType(body) {
  return $.ajax({
    url: BASE_URL + "/v1/proptype",
    type: "POST",
    data: JSON.stringify(body),
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  })
}
function onPageLoad() {
    // Shittiest onPageLoad implementation
    if (localStorage.getItem('cstoken') == null) {
        window.location = 'cover.html'
    }
}

$('#target').keypress(function(event) { 
    return event.keyCode != 13;
}); 

function plotGraph(data, title, ylim) {
  console.log('Plotting graph...')
  const layout = {
    showlegend: true,
    legend: {
      orientation: 'h'
    },

    title: title,
    xaxis: {
      title: '',
      tickangle: -90,
      autorange: true
    },
    yaxis: {
      title: 'Average psf($)',
      range: ylim
    // autorange: true
    },

  };

  Plotly.newPlot('unit', data, layout);
}

function standardDeviation(values) {
  var avg = average(values);

  var squareDiffs = values.map(function(value) {
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data) {
  var sum = data.reduce(function(sum, value) {
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function postData(projName, propType, floor, year, propSize, quarter) {
  $('#loader').removeClass('hidden')
  const queries = Array(4).fill(0).map((val, idx) => {
    let quarterNum = quarter + idx
    const _year = year + Math.ceil(quarterNum / 4) - 1
    quarterNum = quarterNum > 4 ? quarterNum % 4 : quarterNum
    const quarterStr = _year.toString() + 'Q' + quarterNum.toString()
    const body = {
      'projectName': projName,
      'propertyType': propType,
      'floor': floor,
      'quarter': quarterStr,
      'typeOfSale': 'Resale',
      'token': 'asdasd',
      'area': propSize
    }

    return fetchQuarterPred(body)
  })
  
  const projectHistory = fetchHistory({
    from: '2015Q1',
    projectName: projName
  })

  const forecast = Promise.all(queries)
    .then(res => {
      const quarters = res.map((val) => val.quarter)
      const projectPreds = res.map((val) => val.project)
      const unitPreds = res.map((val) => val.unit)
      return [quarters, projectPreds, unitPreds]
    })

  Promise.all([projectHistory, forecast])
    .then(res => {
      $('#unit').removeClass('hidden')
    $('#table').removeClass('hidden')
    $('#card').removeClass('hidden')
    $('#card2').removeClass('hidden')
      $('#loader').hide()
      const projectHistory = res[0]
      const forecast = res[1]
      const forecastQuarters = forecast[0]
      const forecastProject = forecast[1]
      const forecastUnit = forecast[2]
      if (projectHistory.length == 0) {
        alert('There are no recent transactions for this query, the predictions might be inaccurate!')
        const unitForecastPlot = {
          x: forecastQuarters,
          y: forecastUnit.map((label) => parseFloat(label)),
          type: 'scatter',
          name: 'Forecast unit psf',
          mode: 'markers',
          marker: {
            color: 'green',
            symbol: 'x',
            size: 10
          }
        }

        const projectForecastPlot = {
          x: forecastQuarters,
          y: forecastProject.map((label) => parseFloat(label)),
          type: 'scatter',
          name: 'Forecast average project psf',
          line: {
            dash: 'dashdot',
            color: 'red',
            width: 2
          }
        }
        const allPrices = forecastProject.concat(forecastUnit)
        const ylim = [
          Math.min.apply(null, allPrices) - standardDeviation(allPrices),
          Math.max.apply(null, allPrices) + standardDeviation(allPrices)
        ]

        plotGraph(
          [projectForecastPlot, unitForecastPlot],
          projName,
          ylim
        )
        return
      }
      const projectHistoryPrice = projectHistory[1].map((label) => parseFloat(label))
      const mainPlot = {
        x: projectHistory[0],
        y: projectHistoryPrice,
        type: 'scatter',
        name: 'ACTUAL average project psf',
        line: {
          dash: 'solid',
          width: 2
        }
      }
      const lastHistory = projectHistory.map(x => x[x.length - 1])
      console.log(forecastUnit)
      const unitForecastPlot = {
        x: forecastQuarters,
        y: forecastUnit.map((label) => parseFloat(label)),
        type: 'scatter',
        name: 'FORECAST unit psf',
        mode: 'markers',
        marker: {
          color: 'green',
          symbol: 'x',
          size: 10
        }
      }


      const projectForecastPlot = {
        x: [lastHistory[0]].concat(forecastQuarters),
        y: [lastHistory[1]].concat(forecastProject).map((label) => parseFloat(label)),
        type: 'scatter',
        name: 'FORECAST average project psf',
        line: {
          dash: 'dashdot',
          color: 'red',
          width: 2
        }
      }

      const allPrices = forecastUnit.concat(forecastProject).concat(projectHistory[1]).map((label) => parseFloat(label))

      $(q).text('Quarter')
      $(fup).text('Forecast Unit Price')
      var i = 1
      for (var j = 0; j < forecastUnit.length; j++) {
        unitPrice = Math.round(forecastUnit[j] * propSize)
        $('#q' + i).text('2017Q' + i)
        $('#q' + i + 'price').text("$ " + (unitPrice.toLocaleString()))
        i++
      }

      const ylim = [
        Math.min.apply(null, allPrices) - 5 * standardDeviation(allPrices),
        Math.max.apply(null, allPrices) + 5 * standardDeviation(allPrices)
      ]

      plotGraph(
        [mainPlot, projectForecastPlot, unitForecastPlot],
        projName,
        ylim
      )
    })
    .catch(err => {
      console.error(err)
      alert('Sorry, no such property found!')
    })
}

let inputChangeTimeout

$(document).ready(function() {
  console.log('Document Ready.')
  onPageLoad()
  $('#projName').keyup(() => {
    clearTimeout(inputChangeTimeout)

    inputChangeTimeout = setTimeout(() => {
      const projName = $('#projName').val().toUpperCase()
      if (projName === "") {
        $('#propType').val('')
        $('#propType').material_select()
        return false
      }

      console.log("Fetching propType...")
      fetchPropType({
        projectName: projName
      })
        .then((res) => {
          if (res.error) {
            // Maybe render an error message to tell user input is wrong
            console.error(res.error)
            return false
          }
          const propType = res.result
          console.log('Property Type: ', propType)
          $('#propType').val(propType)
          $('#propType').material_select()
        })
        .catch((err) => {
          // No project found probably
          console.error(err)
        })
    }, 750)
  })


  $("#target").submit(function(e) {
    
    e.preventDefault()
    const projName = $('#projName').val().toUpperCase()
    const propType = $('#propType').val()
    const floor = $('#floor').val()
    const year = parseInt($('#year').val())
    const propSize = parseFloat($('#propSize').val())
    const quarter = parseInt($('#quarter').val())
    if (!year) {
      alert('No year selected!')
      return false
    }
    if (!quarter) {
      alert('No quarter selected!')
      return false
    }
    postData(projName, propType, floor, year, propSize, quarter);

  })
})

$('#clear').on('click', function() {
  console.log('clear')
  window.location.reload()
})


