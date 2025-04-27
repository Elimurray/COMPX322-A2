// script.js
document.addEventListener("DOMContentLoaded", function () {
  const commoditySelect = document.getElementById("commodity-select");
  const widgetsContainer = document.getElementById("widgets-container");
  const chartCanvas = document.getElementById("price-chart");
  let commodities = [];
  let currentChart = null;
  let activeCommodity = null;

  // Fetch commodities from server
  fetch("dbconnect.php")
    .then((response) => response.json())
    .then((data) => {
      // Sort the commodities alphabetically by name
      commodities = data.sort((a, b) => a.name.localeCompare(b.name));
      populateCommoditySelect(commodities);
    });

  // Populate dropdown with commodities
  function populateCommoditySelect(data) {
    commodities = data;
    console.log(commodities);
    commoditySelect.innerHTML =
      '<option value="">Select a commodity...</option>';
    commodities.forEach((commodity) => {
      const option = document.createElement("option");
      option.value = commodity.id;
      option.textContent = commodity.name;
      commoditySelect.appendChild(option);
    });
  }

  // Handle commodity selection
  commoditySelect.addEventListener("change", function () {
    const commodityId = this.value;
    if (!commodityId) return;

    const commodity = commodities.find((c) => c.id == commodityId);
    if (commodity && !document.getElementById(`widget-${commodity.id}`)) {
      createCommodityWidget(commodity);
    }
  });

  // Commodity Widget Constructor
  function CommodityWidget(commodity) {
    this.commodity = commodity;
    this.widgetElement = document.createElement("div");
    this.widgetElement.className = "commodity-widget";
    this.widgetElement.id = `widget-${commodity.id}`;

    this.render = function () {
      this.widgetElement.innerHTML = `
                <h3>${commodity.name}</h3>
                <p>Code: ${commodity.code}</p>
                <p>${commodity.information}</p>
                <button class="graph-btn" data-id="${commodity.id}">Show Graph</button>
                <button class="compare-btn" data-id="${commodity.id}">Compare</button>
                <button class="remove-btn" data-id="${commodity.id}">Remove</button>
            `;

      widgetsContainer.appendChild(this.widgetElement);

      // Add event listeners
      this.widgetElement
        .querySelector(".graph-btn")
        .addEventListener("click", () => {
          fetchCommodityData(commodity, false);
        });

      this.widgetElement
        .querySelector(".compare-btn")
        .addEventListener("click", () => {
          fetchCommodityData(commodity, true);
        });

      this.widgetElement
        .querySelector(".remove-btn")
        .addEventListener("click", () => {
          this.widgetElement.remove();
          if (activeCommodity === commodity.id) {
            clearChart();
          }
        });
    };

    this.render();
  }

  // Fetch commodity price data from Alpha Vantage
  function fetchCommodityData(commodity, isComparison) {
    const apiKey = "demo"; // Your API key
    //const apiKey = "J834UF0WEO4JKA5G"; // Your API key
    const n = commodity.name.toUpperCase();
    const url = `https://www.alphavantage.co/query?function=${n}&interval=monthly&apikey=${apiKey}`;

    console.log("Fetching data from:", url); // Debug log

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data); // Debug log

        if (data["Error Message"]) {
          throw new Error(data["data"]);
        }

        const timeSeries = data["data"];
        const labels = [];
        const prices = [];

        // Extract and sort data by date (newest first)
        // const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
        const sortedDates = timeSeries.sort((a, b) => {
          // Convert dates to timestamps for comparison
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB; // For descending order (newest first)
        });

        console.log;

        sortedDates.forEach((item) => {
          if (!isNaN(item.value)) {
            labels.push(item.date);
            prices.push(parseFloat(item.value));
          }
        });

        console.log("Processed data - Labels:", labels, "Prices:", prices); // Debug log

        if (labels.length === 0 || prices.length === 0) {
          throw new Error("No valid data points found");
        }

        if (isComparison && activeCommodity) {
          addToChart(commodity, labels, prices);
        } else {
          createChart(commodity, labels, prices);
          activeCommodity = commodity.id;
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        alert("Error fetching data: " + error.message);
      });
  }

  // Create chart with Chart.js
  function createChart(commodity, labels, prices) {
    if (currentChart) {
      currentChart.destroy();
    }
    let color = getRandomColor();
    const ctx = chartCanvas.getContext("2d");
    currentChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: commodity.name,
            data: prices,
            borderColor: color,
            backgroundColor: color.replace(")", ",0.2)"),
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${commodity.name} Monthly Prices`,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Price ($)",
              font: {
                weight: "bold",
              },
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
              font: {
                weight: "bold",
              },
            },
          },
        },
      },
    });
  }

  // Add dataset to existing chart
  function addToChart(commodity, labels, prices) {
    if (!currentChart) return;
    let color = getRandomColor();
    currentChart.data.datasets.push({
      label: commodity.name,
      data: prices,
      borderColor: color,
      backgroundColor: color.replace(")", ",0.2)"),
      tension: 0.3,
      fill: true,
    });

    currentChart.update();
  }

  // Clear the chart
  function clearChart() {
    if (currentChart) {
      currentChart.destroy();
      currentChart = null;
    }
    activeCommodity = null;
  }

  // Helper function to generate random colors
  function getRandomColor() {
    return `rgb(${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
  }

  // Create new widget
  function createCommodityWidget(commodity) {
    new CommodityWidget(commodity);
  }
});
