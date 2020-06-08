/**
 * Data Explorer main widget file
 * Developed By: Ben Richie Sadan @ Sisense
 * Version : 1.0.0
 */

prism.on("beforemenu", ListenerToMenu);

var modal;

var availableTablesDiv;

var tableArea;

var queryInput;

var numOfResults;

var chartArea;

var lastQueryResults;

var columnsSelectionByTable;

var getChartBtn;

var getPieChartBtn;

var downloadCsvBtn;

var paggingData;

var tableNames = [];
var tablesOptions = [];

var currData;

function ListenerToMenu(name, items, widget) {
  if (dataExplorerConfig.AllowedUsers.includes(prism.user.roleName) == false) {
    return;
  }

  if (
    items.settings.scope.widget != null &&
    items.settings.scope.widget.type.includes("pivot") == false
  ) {
    var clickObj = {
      caption: "Data Explorer",
      closing: true,
      data: {
        event: name,
        items: items,
      },
      execute: function () {
        clickListener(this.data);
      },
    };

    items.settings.items.push(clickObj);
  }
}

function clickListener(data) {
  currData = data;

  showModalWindow(data);
}

function showModalWindow(data) {
  if (modal == null) {
    buildModalWindow();
  }

  modal.style.display = "block";

  $(chartArea).empty();

  queryInput.value = "";

  getChartBtn.style.display = "none";
  getPieChartBtn.style.display = "none";

  getDataForTableOptions();

  lastQueryResults = data.items.settings.scope.widget.rawQueryResult;

  buildLocalDataTable(lastQueryResults, tableArea);
}

function buildModalWindow() {
  let docBody = document.getElementById("prism-window");

  modal = document.createElement("div");

  modal.className = 'dataExpl-modal';

  let modalInner = document.createElement("div");
  modalInner.className = "md-content dataExpl-modal-inner";

  modal.appendChild(modalInner);

  let headerHolder = document.createElement("div");
  headerHolder.className = "dataExpl-header-holder";

  let headerTitle = document.createElement("div");
  headerTitle.innerText = "Data Explorer";

  headerHolder.appendChild(headerTitle);

  modalInner.appendChild(headerHolder);

  let modalContentDiv = document.createElement("div");
  modalContentDiv.id = "dataExplorerModalWindowContentDiv";
  modalContentDiv.className = 'dataExpl-Modal-WindowContentDiv';

  modalInner.appendChild(modalContentDiv);

  let leftBarDivElm = document.createElement("div");
  leftBarDivElm.id = "leftBarDiv";
  leftBarDivElm.style.left = "0";
  leftBarDivElm.style.width = "20%";
  leftBarDivElm.style.overflow = "auto";

  let centralExpAreaElm = document.createElement("div");
  centralExpAreaElm.id = "centralDataExplorerArea";
  centralExpAreaElm.style.width = "80%";
  centralExpAreaElm.style.overflow = "auto";
  centralExpAreaElm.style.padding = "0 4px 0px 4px";

  let queryDiv = document.createElement("div");
  queryDiv.style.display = "grid";

  let allDataBtn = document.createElement("button");
  allDataBtn.id = "exploreAllDataBtn";
  allDataBtn.className = "btn dataExpl-btn";
  allDataBtn.innerText = "Type SQL!!!";
  allDataBtn.addEventListener("click", moreDataClicked);

  queryInput = document.createElement("textarea");
  queryInput.id = "queryStringInput";
  queryInput.className = 'query-string-input'

  queryDiv.appendChild(queryInput);
  queryDiv.appendChild(allDataBtn);

  downloadCsvBtn = document.createElement("button");
  downloadCsvBtn.id = "downloadCsvBtn";
  downloadCsvBtn.className = "btn dataExpl-btn";
  downloadCsvBtn.innerText = "Download CSV";
  downloadCsvBtn.addEventListener("click", downloadCSVNow);

  getChartBtn = document.createElement("button");
  getChartBtn.id = "getChartBtn";
  getChartBtn.className = "btn dataExpl-btn";
  getChartBtn.innerText = "Get Chart!!!";
  getChartBtn.style.display = "none";
  getChartBtn.addEventListener("click", populateDataObjectForBarChart);

  getPieChartBtn = document.createElement("button");
  getPieChartBtn.id = "getPieChartBtn";
  getPieChartBtn.className = "btn dataExpl-btn";
  getPieChartBtn.innerText = "Get Pie!!!";
  getPieChartBtn.style.display = "none";
  getPieChartBtn.addEventListener("click", populateDataObjectForPieChart);

  availableTablesDiv = document.createElement("div");
  availableTablesDiv.id = "tablesInWidgetHolderDiv";
  availableTablesDiv.style.overflow = "auto";

  tableArea = document.createElement("div");
  tableArea.id = "tableAreaDiv";
  tableArea.className = 'tableArea-div';

  numOfResults = document.createElement("h3");
  numOfResults.id = "totalRowsInQueryResultTitle";

  let pagingIndicationDiv = document.createElement('div');
  pagingIndicationDiv.id = 'explorerPagerButtonsDiv';
  pagingIndicationDiv.style.display = 'none';

  let numOfPagesTitleElm = document.createElement('h4');
  numOfPagesTitleElm.id = 'explorerNumOfPagesTitle';

  let firstPageElm = document.createElement("button");
  firstPageElm.id = "explorerFirstPageBtn";
  firstPageElm.className = "btn dataExpl-btn";
  firstPageElm.innerText = "First";
  firstPageElm.addEventListener("click", firstPageClicked);

  let prevPageElm = document.createElement("button");
  prevPageElm.id = "explorerPrevPageBtn";
  prevPageElm.className = "btn dataExpl-btn";
  prevPageElm.innerText = "Prev";
  prevPageElm.addEventListener("click", prevPageClick);

  let nextPageElm = document.createElement("button");
  nextPageElm.id = "explorerNextPageBtn";
  nextPageElm.className = "btn dataExpl-btn";
  nextPageElm.innerText = "Next";
  nextPageElm.addEventListener("click", nextPageClicked);

  let lastPageElm = document.createElement("button");
  lastPageElm.id = "explorerLastPageBtn";
  lastPageElm.className = "btn dataExpl-btn";
  lastPageElm.innerText = "Last";
  lastPageElm.addEventListener("click", lastPageClick);

  pagingIndicationDiv.append(numOfPagesTitleElm);
  pagingIndicationDiv.append(firstPageElm);
  pagingIndicationDiv.append(prevPageElm);
  pagingIndicationDiv.append(nextPageElm);
  pagingIndicationDiv.append(lastPageElm);

  paggingData = {};

  paggingData.totalData = null;
  paggingData.holderDiv = pagingIndicationDiv;
  paggingData.currentPage = 0;
  paggingData.pageSize = dataExplorerConfig.pageSize;
  paggingData.numOfPagesTitle = numOfPagesTitleElm;
  paggingData.firstPageBtn = firstPageElm;
  paggingData.lastPageBtn = lastPageElm;
  paggingData.prevPageBtn = prevPageElm;
  paggingData.nextPageBtn = nextPageElm;

  chartArea = document.createElement("div");
  chartArea.id = "chartAreaDiv";
  chartArea.className = 'chartArea-div';

  leftBarDivElm.appendChild(availableTablesDiv);

  centralExpAreaElm.appendChild(queryDiv);
  centralExpAreaElm.appendChild(numOfResults);
  centralExpAreaElm.appendChild(pagingIndicationDiv);
  centralExpAreaElm.appendChild(tableArea);
  centralExpAreaElm.appendChild(downloadCsvBtn);
  centralExpAreaElm.appendChild(getChartBtn);
  centralExpAreaElm.appendChild(getPieChartBtn);
  centralExpAreaElm.appendChild(chartArea);

  modalContentDiv.appendChild(leftBarDivElm);
  modalContentDiv.appendChild(centralExpAreaElm);

  docBody.appendChild(modal);

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

function buildUsedTablesInWidgetDiv() {
  let holderDiv = document.createElement("div");
}

function moreDataClicked() {
  if (queryInput.value == "") {
    alert("Please write a query!");
  } else {
    executeQueryFromInput();
  }
}

function createRequestHeaders() {
  var myHeaders = new Headers();
  let bearerVal = document.cookie.replace("XSRF-TOKEN=", "Bearer ");
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authentication", bearerVal);

  return myHeaders;
}

async function fetchQuery(dataSourceTitle, queryToUse) {
  var myHeaders = createRequestHeaders();

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  let url =
    "/api/datasources/" +
    dataSourceTitle +
    "/sql?count=-1&includeMetadata=true&isMaskedResponse=false&offset=0&query=" +
    queryToUse;

  let response = await fetch(url, requestOptions).then(async function (response) {
    return myJson = response.json();
  });

  return response;
}

async function executeQueryFromInput() {
  $(chartArea).empty();
  $(tableArea).empty();

  paggingData.holderDiv.style.display = 'none';

  downloadCsvBtn.style.display = 'none';
  getChartBtn.style.display = "none";
  getPieChartBtn.style.display = "none";

  addLoadingToDiv(tableArea);

  let queryToUse = queryInput.value.replace(/\n/g, ' ');

  fetchQuery(currData.items.settings.scope.widget.datasource.title, queryToUse).then(function (queryResult) {
    if (queryResult.error) {
      $(tableArea).empty();

      tableArea.innerText = JSON.parse(queryResult.details).error;
    } else {
      lastQueryResults = queryResult;
      var table = buildLocalDataTable(queryResult, tableArea);

      downloadCsvBtn.style.display = '';

      if (queryResult.headers.length == 2) {
        getChartBtn.style.display = "";
        getPieChartBtn.style.display = "";
      }
    }
  });
}

function buildLocalDataTable(data, tableContainer) {
  numOfResults.innerHTML = "Total Rows: " + new Intl.NumberFormat().format(data.values.length);

  let rowsToRended = paggingData.pageSize;

  let dataToRender;

  paggingData.totalData = null;
  paggingData.headers = null;

  if (data.values.length <= rowsToRended) {
    rowsToRended = data.values.length;
    paggingData.holderDiv.style.display = 'none';

    dataToRender = data.values;

    renderTable(tableContainer, data.headers, dataToRender);
  } else {
    manageResultsWithPager(tableContainer, data.headers, data.values);
  }

  return tableContainer;
}

async function renderTable(container, headers, data) {
  $(container).empty();
  var table = $("<table/>").addClass("CSSTableGenerator");

  let restuctureArr = [];

  let headerRow = $("<tr/>");
  $.each(headers, function (rowIndex, r) {
    let header = $("<th/>").text(r);
    headerRow.append(header);
  });
  table.append(headerRow);

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    let r = data[rowIndex];

    var row = $("<tr/>");
    $.each(r, function (colIndex, c) {
      let value = c.text;

      if (value == null) {
        value = c;
      }

      if (restuctureArr.length - 1 < rowIndex) {
        restuctureArr.push([]);
      }

      restuctureArr[rowIndex].push(value);

      let curTd = $("<td/>").text(value);

      row.append(curTd);
    });
    table.append(row);
  }

  if (restuctureArr.length > 0) {
    lastQueryResults.values = restuctureArr;
  }

  container.append(table[0]);
}

function manageResultsWithPager(tableContainer, headers, totaldata) {
  paggingData.headers = headers;
  paggingData.totalData = totaldata;
  paggingData.totalPages = Math.round(totaldata.length / paggingData.pageSize);
  paggingData.holderDiv.style.display = '';

  goToPage(1);
}

function nextPageClicked(event) {
  goToPage(paggingData.currentPage + 1);
}

function prevPageClick(event) {
  goToPage(paggingData.currentPage - 1);
}

function firstPageClicked(event) {
  goToPage(1);
}

function lastPageClick(event) {
  goToPage(paggingData.totalPages);
}

function goToPage(num) {
  paggingData.currentPage = num;
  paggingData.numOfPagesTitle.innerHTML = 'Page ' + (new Intl.NumberFormat().format(paggingData.currentPage)) +
    ' out of ' + (new Intl.NumberFormat().format(paggingData.totalPages)) + ' Pages';

  paggingData.prevPageBtn.disabled = false;
  $(paggingData.prevPageBtn).removeClass('disabled-btn');
  paggingData.nextPageBtn.disabled = false;
  $(paggingData.nextPageBtn).removeClass('disabled-btn');

  paggingData.firstPageBtn.disabled = false;
  $(paggingData.firstPageBtn).removeClass('disabled-btn');
  paggingData.lastPageBtn.disabled = false;
  $(paggingData.lastPageBtn).removeClass('disabled-btn');

  if (paggingData.currentPage == 1) {
    paggingData.firstPageBtn.disabled = true;
    $(paggingData.firstPageBtn).addClass('disabled-btn');
    paggingData.prevPageBtn.disabled = true;
    $(paggingData.prevPageBtn).addClass('disabled-btn');
  } else if (paggingData.currentPage == paggingData.totalPages) {
    paggingData.lastPageBtn.disabled = true;
    $(paggingData.lastPageBtn).addClass('disabled-btn');
    paggingData.nextPageBtn.disabled = true;
    $(paggingData.nextPageBtn).addClass('disabled-btn');
  }

  renderTable(tableArea, paggingData.headers,
    paggingData.totalData.slice((paggingData.pageSize * (paggingData.currentPage - 1)),
      (paggingData.pageSize * paggingData.currentPage)));
}

async function getAllDataFromTable() {
  let queryToUse = "select * from [" +
    currData.items.settings.scope.widget.rawQueryResult.metadata[0].jaql.table +
    "]";

  fetchQuery(currData.items.settings.scope.widget.datasource.title, queryToUse).then(function (response) {
    buildLocalDataTable(response, tableArea);
  });
}

async function getDataForTableOptions() {
  $(availableTablesDiv).empty();
  let widget = currData.items.settings.scope.widget;
  tableNames = [];
  tablesOptions = [];

  columnsSelectionByTable = {};

  for (let index = 0; index < widget.rawQueryResult.metadata.length; index++) {
    let panelObject = widget.rawQueryResult.metadata[index];

    if (panelObject.jaql.context) {
      for (let key in panelObject.jaql.context) {
        if (panelObject.jaql.context.hasOwnProperty(key)) {
          let curPanelJaql = panelObject.jaql.context[key];
          generateTableOptions(curPanelJaql);
        }
      }
    } else {
      generateTableOptions(panelObject.jaql);
    }
  }
}

async function generateTableOptions(jaqlObj) {
  if (tableNames.includes(jaqlObj.table) == false) {
    let tableObj = {
      name: jaqlObj.table,
      datasource: currData.items.settings.scope.widget.datasource,
    };

    tableNames.push(tableObj.name);

    columnsSelectionByTable[tableObj.name] = {};

    getTableHeaders(
      tableObj.name,
      tableObj.datasource
    ).then(function (headersResult) {
      tableObj.headers = headersResult;

      tablesOptions.push(tableObj);

      let holderDiv = document.createElement("div");
      holderDiv.className = 'tableOptions-div';
      holderDiv.id = "table" + tableObj.name + "availColumnsDiv";

      let tableNameElm = document.createElement("h3");
      tableNameElm.innerHTML = "Table: [" + tableObj.name + "]";

      let numOfRowsTableElm = document.createElement("h4");
      numOfRowsTableElm.innerHTML = "Total Rows:";
      numOfRowsTableElm.id = "table" + tableObj.name + "TotalRowsLbl";

      getTotalRowsInTable(
        tableObj.name,
        tableObj.datasource,
        numOfRowsTableElm
      ).then(function (numOfRows) {
        numOfRowsTableElm.innerHTML = "Total Rows: " + new Intl.NumberFormat().format(numOfRows);
      });

      let queryTableBtn = document.createElement("button");
      queryTableBtn.id = "queryFullTable" + tableObj.name;
      queryTableBtn.className = "btn dataExpl-btn";
      queryTableBtn.innerText = "Query";
      queryTableBtn.addEventListener("click", queryFullTable);

      let columnsTitle = document.createElement("h4");
      columnsTitle.innerHTML = "Columns:";

      holderDiv.append(tableNameElm);
      holderDiv.append(numOfRowsTableElm);
      holderDiv.append(queryTableBtn);
      holderDiv.append(columnsTitle);

      tableObj.headers.forEach((curCol) => {
        let lbl = document.createElement("label");
        let chxBox = document.createElement("input");
        chxBox.type = "checkbox";
        chxBox.name = curCol;
        chxBox.tableName = tableObj.name;

        lbl.append(chxBox);
        lbl.innerHTML += "[" + curCol + "]";

        holderDiv.append(lbl);

        columnsSelectionByTable[tableObj.name][curCol] = chxBox;
      });

      availableTablesDiv.append(holderDiv);
    });
  }
}

function queryFullTable(event) {
  let tableName = event.target.id.replace("queryFullTable", "");
  let selectedColumns = "";

  let columnsCheck = document.getElementById(
    "table" + tableName + "availColumnsDiv"
  ).children;

  columnsCheck.forEach((Element) => {
    if (Element.firstChild != null && Element.firstChild.type == "checkbox") {
      if (Element.firstChild.checked == true) {
        if (selectedColumns != "") {
          selectedColumns += ", ";
        }

        selectedColumns += "[" + Element.firstChild.name + "]";
      }
    }
  });

  if (selectedColumns == "") {
    queryInput.value = "select * from [" + tableName + "]";
  } else {
    queryInput.value =
      "select " + selectedColumns + " from [" + tableName + "]";
  }

  executeQueryFromInput();
}

async function getTableHeaders(tableName, datasource) {
  let queryToUse = "select * from [" +
    tableName +
    "] LIMIT 1";

  let response = await fetchQuery(datasource.title, queryToUse).then(function (queryResult) {
    return queryResult;
  });

  return response.headers;
}

async function getTotalRowsInTable(tableName, datasource, elmToSetTo) {
  let queryToUse = "select COUNT(*) from [" +
    tableName +
    "]";

  let response = await fetchQuery(datasource.title, queryToUse).then(function (queryResult) {
    return queryResult.values[0];
  });

  return response;
}

function populateDataObjectForBarChart() {
  let chartConfig = {
    chartTitle: "Custom Chart from query!!!",
    xAxisTitle: lastQueryResults.headers[0],
    yAxisTitle: lastQueryResults.headers[1],
    data: lastQueryResults.values,
  };

  renderBarChart(chartConfig);
}

function renderBarChart(config) {
  Highcharts.chart(chartArea, {
    chart: {
      type: "column",
    },
    title: {
      text: config.chartTitle,
    },
    subtitle: {
      text: "WIP Data Explorer",
    },
    xAxis: {
      type: "category",
      labels: {
        rotation: -45,
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif",
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: config.yAxisTitle,
      },
    },
    legend: {
      enabled: true,
    },
    tooltip: {
      pointFormat: config.yAxisTitle + ": {point.y:.1f}",
    },
    series: [{
      name: config.xAxisTitle,
      data: config.data,
      dataLabels: {
        enabled: true,
        rotation: -90,
        color: "#FFFFFF",
        align: "right",
        format: "{point.y:.1f}",
        y: 10,
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif",
        },
      },
    }, ],
  });
}

function populateDataObjectForPieChart() {
  let strucutredData = [];

  for (let index = 0; index < lastQueryResults.values.length; index++) {
    let curPieSlice = {
      name: lastQueryResults.values[index][0],
      y: lastQueryResults.values[index][1],
    };

    strucutredData.push(curPieSlice);
  }

  let chartConfig = {
    chartTitle: "Custom Pie Chart from query!!!",
    data: [{
      name: lastQueryResults.headers[0],
      colorByPoint: true,
      data: strucutredData,
    }, ],
  };

  renderPieChart(chartConfig);
}

function renderPieChart(config) {
  Highcharts.chart(chartArea, {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: "pie",
    },
    title: {
      text: config.chartTitle,
    },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    accessibility: {
      point: {
        valueSuffix: "",
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}",
        },
      },
    },
    series: config.data,
  });
}

function addLoadingToDiv(divLoading) {
  let dotsHolder = document.createElement("div");
  dotsHolder.className = "loading-dots";

  for (let index = 0; index < 3; index++) {
    let dotElm = document.createElement("div");
    dotElm.className = "loading-dot";

    dotsHolder.append(dotElm);
  }

  dotsHolder.style.position = "relative";
  dotsHolder.style.top = "50%";
  dotsHolder.style.margin = "auto";

  divLoading.append(dotsHolder);
}

function clearLoading(divToClear) {
  let dotsHolders = divToClear.getElementsByClassName("loading-dots");

  if (dotsHolders != null && dotsHolders[0] != null) {
    dotsHolders[0].remove();
  }
}

function downloadCSVNow() {
  let exportData;

  if (paggingData != null && paggingData.totalData != null) {
    exportData = paggingData.totalData;
    exportData.unshift(paggingData.headers);
  } else {
    exportData = lastQueryResults.values;
    exportData.unshift(lastQueryResults.headers);
  }

  exportToCsv("DataExplorerQueryExport.csv", exportData);
}

function exportToCsv(filename, rows) {
  var processRow = function (row) {
    var finalVal = "";
    for (var j = 0; j < row.length; j++) {
      var innerValue = row[j] === null ? "" : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ",";
      finalVal += result;
    }
    return finalVal + "\n";
  };

  var csvFile = "";
  for (var i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], {
    type: "text/csv;charset=utf-8;"
  });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}