const BASE_URL = 'https://script.google.com/macros/s/AKfycbwPAetwHpx6zr9datFb8rdRS8JYBlOqJhK3wd2J_CdTfCpMVmacmoMSngjnQC2S5rNWWg/exec';
const updateInterval = 60000; // 1 minute

let previousData = {
  main: null,
  courier: null,
  franchise: null,
};

let initialLoad = true;

/**
 * Fetches data from a given route and injects it into the specified container
 * @param {string} route The API route (main, courier, franchise)
 * @param {string} containerId The ID of the container to inject the data into
 */
async function fetchData(route, containerId) {
  try {
    const response = await fetch(`${BASE_URL}?route=${route}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const branchList = document.getElementById(containerId);

    // Compare new data with the previous data
    if (JSON.stringify(previousData[route]) === JSON.stringify(data)) {
      return false; // No changes
    }

    previousData[route] = data; // Store new data for comparison

    branchList.innerHTML = ''; // Clear the container

    // Sort branches by percentage in ascending order (from lowest to highest)
    data.sort((a, b) => a.percent - b.percent);

    // Calculate totals for the summary card
    const totalStaff = data.reduce((sum, branch) => sum + (branch.amountOfPersonal || 0), 0);
    const totalIron = data.reduce((sum, branch) => sum + (branch.iron || 0), 0);
    const totalVacant = data.reduce((sum, branch) => sum + (branch.vacant || 0), 0);
    const totalPercent = (data.reduce((sum, branch) => sum + (branch.percent || 0), 0) / data.length).toFixed(2);
    const totalPrevPercent = (data.reduce((sum, branch) => sum + (branch.prevPercent || 0), 0) / data.length).toFixed(2);

    // Calculate totals for come and went for couriers and main
    const totalCome = data.reduce((sum, branch) => sum + (branch.come || 0), 0);
    const totalWent = data.reduce((sum, branch) => sum + (branch.went || 0), 0);

    // Determine the class of the summary card based on the total percentage
    let totalClass = 'item-high'; // Default is high percentage background
    if (totalPercent > 66 && totalPercent <= 80) {
      totalClass = 'item-medium';
    } else if (totalPercent <= 66) {
      totalClass = 'item-low';
    }

    // Create the summary card
    const summaryItem = document.createElement('div');
    summaryItem.className = `shadow-lg rounded-lg p-4 flex flex-col items-start justify-between w-full ${totalClass}`;
    summaryItem.innerHTML = `
      <div class="flex justify-between w-full">
        <div>
          <p class="text-lg font-semibold">Umumiy xodimlar</p>
          <p class="text-sm text-gray-500">Barcha filiallar</p>
        </div>
        <div class="text-2xl font-bold text-green-600">${totalStaff}</div>
      </div>
      <div class="flex justify-between w-full text-sm text-gray-500 mt-2">
        <p class="text-iron text-yellow-500">Jelezniy grafik: ${totalIron}</p>
        <p class="text-red-500">Vakansiya: ${totalVacant}</p>
      </div>
      <div class="flex justify-between text-sm w-full">
        <p class="text-blue-500">Hozirgi hafta: ${totalPercent}%</p>
        <p class="text-gray-500">Oldingi hafta: ${totalPrevPercent}%</p>
      </div>
      ${route === 'courier' || route === 'main' ? `<div class="flex justify-between w-full text-sm"><p class="text-blue-500">Kelgan: ${totalCome}</p><p class="text-red-500">Ketgan: ${totalWent}</p></div>` : ''}
    `;
    branchList.appendChild(summaryItem);

    // Create individual branch items
    data.forEach(branch => {
      const percentDiff = branch.percent - branch.prevPercent;
      let percentClass = 'percent-same';
      let percentArrow = '⟷';

      if (percentDiff > 0) {
        percentClass = 'percent-up';
        percentArrow = '↑';
      } else if (percentDiff < 0) {
        percentClass = 'percent-down';
        percentArrow = '↓';
      }

      // Determine item class based on branch percent
      let itemClass = 'item-high'; // Default high percent background
      if (branch.percent > 66 && branch.percent <= 80) {
        itemClass = 'item-medium';
      } else if (branch.percent <= 66) {
        itemClass = 'item-low';
      }

      // Add the item to the branch list
      const branchItem = document.createElement('div');
      branchItem.className = `shadow-lg rounded-lg p-4 w-full space-y-2 ${itemClass}`;
      
      branchItem.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <p class="text-lg font-semibold">${branch.branch}</p>
            <p class="text-sm text-gray-500">${branch.amountOfPersonal || 0} ta xodim</p>
          </div>
          <div class="text-2xl font-bold text-blue-600">${branch.amountOfPersonal || 0}</div>
        </div>
        <div class="flex justify-between text-sm text-gray-500">
          <p class="text-iron">Jelezniy grafik: ${branch.iron || 0}</p>
          <p class="text-red-500">Vakansiya: ${branch.vacant || 0}</p>
        </div>
        <div class="flex justify-between text-sm">
          <p class="${percentClass}">Hozirgi hafta: ${branch.percent.toFixed(2)}% ${percentArrow}</p>
          <p class="text-gray-500">Oldingi hafta: ${branch.prevPercent.toFixed(2)}%</p>
        </div>
        ${route === 'courier' || route === 'main' ? `<div class="flex justify-between text-sm"><p class="text-blue-500">Kelgan: ${branch.come}</p><p class="text-red-500">Ketgan: ${branch.went}</p></div>` : ''}
      `;
      branchList.appendChild(branchItem);
    });

    return true; // Data was updated
  } catch (error) {
    console.error(`Error fetching data for ${route}:`, error);
    return false;
  }
}

// Show loader and hide content during updates
function showLoader() {
  if (initialLoad) {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('content').classList.add('hidden');
  }
}

// Hide loader and show content after updates
function hideLoader() {
  if (initialLoad) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
    initialLoad = false;
  }
}

// Fetch and display data for each route
async function updateData() {
  showLoader();
  const results = await Promise.all([
    fetchData('main', 'main-branch-list'),
    fetchData('courier', 'courier-branch-list'),
    fetchData('franchise', 'franchise-branch-list')
  ]);

  if (results.includes(true) || initialLoad) {
    hideLoader();
  }
}

// Initial fetch
updateData();

// Refresh data every 60 seconds
setInterval(updateData, updateInterval);

// Mobile tab navigation
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    
    // Remove active class from all buttons and tabs
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    // Add active class to the selected button and tab
    button.classList.add('active');
    document.getElementById(`${targetTab}-column`).classList.add('active');
  });
});
