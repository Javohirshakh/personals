const BASE_URL = 'https://script.google.com/macros/s/AKfycbyDHVz6SzHavOY-cgyle3fXgbwSDFnLEu2WhGAjRWKcQSnJrGMxdxpEhSmjbqKJvplu_Q/exec';
const updateInterval = 10000; // 10 seconds

let previousData = {
  main: null,
  courier: null,
  franchise: null,
};

let initialLoad = true; // Флаг для отображения лоадера только один раз

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

    // Sort branches by number of vacancies in descending order
    data.sort((a, b) => b.vacant - a.vacant);

    // Corrected summation logic for total staff, iron, and vacancies
    const totalStaff = data.reduce((sum, branch) => sum + (branch.amountOfPersonal || 0), 0);
    const totalIron = data.reduce((sum, branch) => sum + (branch.iron || 0), 0);
    const totalVacant = data.reduce((sum, branch) => sum + (branch.vacant || 0), 0);

    const totalItem = document.createElement('div');
    totalItem.className = 'bg-white shadow-lg rounded-lg p-4 flex flex-col items-start justify-between w-full';
    totalItem.innerHTML = `
      <div class="flex justify-between w-full">
        <div>
          <p class="text-lg font-semibold">Umumiy xodimlar</p>
          <p class="text-sm text-gray-500">Barcha filiallar xodimlari</p>
        </div>
        <div class="text-2xl font-bold text-green-600">${totalStaff}</div>
      </div>
      <div class="flex justify-between w-full text-sm text-gray-500 mt-2">
        <p class="text-yellow-500">Jelezniy grafik: ${totalIron}</p>
        <p class="text-red-500">Vakansiya: ${totalVacant}</p>
      </div>
    `;
    branchList.appendChild(totalItem);

    // Create individual branch items with `iron` and `vacant` data
    data.forEach(branch => {
      const branchItem = document.createElement('div');
      branchItem.className = 'bg-white shadow-lg rounded-lg p-4 w-full space-y-2';
      
      branchItem.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <p class="text-lg font-semibold">${branch.branch}</p>
            <p class="text-sm text-gray-500">${branch.amountOfPersonal || 0} ta xodim</p>
          </div>
          <div class="text-2xl font-bold text-blue-600">${branch.amountOfPersonal || 0}</div>
        </div>
        <div class="flex justify-between text-sm text-gray-500">
          <p class="text-yellow-500">Jelezniy grafik: ${branch.iron || 0}</p>
          <p class="text-red-500">Vakansiya: ${branch.vacant || 0}</p>
        </div>
      `;
      branchList.appendChild(branchItem);
    });

    return true; // Data was updated
  } catch (error) {
    console.error(`Error fetching data for ${route}:`, error);
    const branchList = document.getElementById(containerId);
    branchList.innerHTML = `<p class="text-red-500">Xatolik... Keyinroq urinib ko'ring.</p>`;
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
    initialLoad = false; // Hide loader after initial load
  }
}

// Fetch and display data for each route
async function updateData() {
  showLoader();
  let hasUpdates = false;
  const results = await Promise.all([
    fetchData('main', 'main-branch-list'),
    fetchData('courier', 'courier-branch-list'),
    fetchData('franchise', 'franchise-branch-list')
  ]);

  hasUpdates = results.includes(true);

  if (hasUpdates || initialLoad) {
    hideLoader();
  }
}

// Initial fetch
updateData();

// Refresh data every 10 seconds
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
