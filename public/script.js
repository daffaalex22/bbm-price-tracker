async function fetchPrices() {
  try {
      const response = await fetch('/api/prices');
      const data = await response.json();
      
      // Update prices for each provider
      updateProviderPrices('pertamina-prices', data.prices.Pertamina);
      updateProviderPrices('shell-prices', data.prices.Shell);
      updateProviderPrices('bp-prices', data.prices['BP-AKR']);

      // Update last updated timestamp
      const lastUpdated = new Date().toLocaleString('id-ID', {
          dateStyle: 'full',
          timeStyle: 'short'
      });
      document.getElementById('last-updated').textContent = lastUpdated;
  } catch (error) {
      console.error('Error fetching prices:', error);
      showError();
  }
}

function updateProviderPrices(elementId, prices) {
  const container = document.getElementById(elementId);
  if (!prices) {
      container.innerHTML = '<p class="text-red-500">No data available</p>';
      return;
  }

  container.innerHTML = Object.entries(prices)
      .map(([key, value]) => `
          <div class="flex justify-between items-center">
              <span class="text-gray-600">${formatFuelName(key)}</span>
              <span class="font-medium text-gray-900">${value}</span>
          </div>
      `)
      .join('');
}

function formatFuelName(name) {
  return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
}

function showError() {
  const containers = ['pertamina-prices', 'shell-prices', 'bp-prices'];
  containers.forEach(id => {
      document.getElementById(id).innerHTML = 
          '<p class="text-red-500">Failed to load prices</p>';
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchPrices);