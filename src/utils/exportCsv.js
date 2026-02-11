/**
 * Export CSV Utility - Export portfolio holdings and transactions as CSV
 * Fetches data from Supabase and converts to downloadable CSV files
 */

import { supabase } from '../supabase/client';

/**
 * Fetch portfolio holdings from Supabase
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Array>} Array of holdings with calculations
 */
export const fetchPortfolioData = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching holdings:', error);
      throw error;
    }

    // Transform data with calculations
    const portfolioData = data.map(holding => {
      const quantity = parseFloat(holding.quantity);
      const buyPrice = parseFloat(holding.buy_price);
      const currentPrice = parseFloat(holding.current_price) || 0;
      const totalValue = quantity * currentPrice;
      const totalCost = quantity * buyPrice;
      const profitLoss = totalValue - totalCost;

      return {
        coin_name: holding.name,
        symbol: holding.symbol,
        quantity: quantity,
        buy_price: buyPrice,
        current_price: currentPrice,
        total_value: totalValue,
        profit_loss: profitLoss,
        created_at: holding.created_at
      };
    });

    return portfolioData;
  } catch (error) {
    console.error('❌ Error in fetchPortfolioData:', error);
    throw error;
  }
};

/**
 * Fetch transaction history from Supabase
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Array>} Array of transactions
 */
export const fetchTransactionData = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      throw error;
    }

    // Transform data to match CSV format
    const transactionData = data.map(tx => ({
      type: tx.action,
      coin: tx.name,
      quantity: parseFloat(tx.quantity),
      price: parseFloat(tx.price),
      total: parseFloat(tx.total),
      created_at: tx.timestamp
    }));

    return transactionData;
  } catch (error) {
    console.error('❌ Error in fetchTransactionData:', error);
    throw error;
  }
};

/**
 * Convert data array to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with key and label
 * @returns {string} CSV formatted string
 */
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headerRow = headers.map(h => h.label).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      let value = row[h.key];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Format numbers with 2 decimal places
      if (typeof value === 'number') {
        value = value.toFixed(2);
      }
      
      // Escape quotes and wrap in quotes if contains comma or quotes
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
      }
      
      return value;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Trigger browser download of CSV file
 * @param {string} filename - Name of the file to download
 * @param {string} csvString - CSV formatted string
 */
export const downloadCSV = (filename, csvString) => {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Export portfolio holdings only
 * @returns {Promise<Object>} Object with success status and message
 */
export const exportPortfolioOnly = async () => {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch portfolio data from Supabase
    const portfolioData = await fetchPortfolioData(user.id);

    // Check if data exists
    if (!portfolioData || portfolioData.length === 0) {
      return {
        success: false,
        message: 'No Portfolio Data to Export'
      };
    }

    // Define CSV headers
    const portfolioHeaders = [
      { key: 'coin_name', label: 'Coin Name' },
      { key: 'symbol', label: 'Symbol' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'buy_price', label: 'Buy Price' },
      { key: 'current_price', label: 'Current Price' },
      { key: 'total_value', label: 'Total Value' },
      { key: 'profit_loss', label: 'Profit/Loss' },
      { key: 'created_at', label: 'Created At' }
    ];

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().split('T')[0];

    // Export portfolio CSV
    const portfolioCSV = convertToCSV(portfolioData, portfolioHeaders);
    downloadCSV(`portfolio_${timestamp}.csv`, portfolioCSV);

    return {
      success: true,
      message: 'Portfolio CSV Downloaded Successfully'
    };

  } catch (error) {
    console.error('❌ Error exporting portfolio CSV:', error);
    return {
      success: false,
      message: error.message || 'Failed to export portfolio CSV'
    };
  }
};

/**
 * Export transactions only
 * @returns {Promise<Object>} Object with success status and message
 */
export const exportTransactionsOnly = async () => {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch transaction data from Supabase
    const transactionData = await fetchTransactionData(user.id);

    // Check if data exists
    if (!transactionData || transactionData.length === 0) {
      return {
        success: false,
        message: 'No Transaction Data to Export'
      };
    }

    // Define CSV headers
    const transactionHeaders = [
      { key: 'type', label: 'Type' },
      { key: 'coin', label: 'Coin' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'price', label: 'Price' },
      { key: 'total', label: 'Total' },
      { key: 'created_at', label: 'Date' }
    ];

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().split('T')[0];

    // Export transaction CSV
    const transactionCSV = convertToCSV(transactionData, transactionHeaders);
    downloadCSV(`transactions_${timestamp}.csv`, transactionCSV);

    return {
      success: true,
      message: 'Transactions CSV Downloaded Successfully'
    };

  } catch (error) {
    console.error('❌ Error exporting transactions CSV:', error);
    return {
      success: false,
      message: error.message || 'Failed to export transactions CSV'
    };
  }
};

/**
 * Main export function - fetches data and downloads both CSV files
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object>} Object with success status and message
 */
export const exportPortfolioCSV = async (userId) => {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch data from Supabase
    const [portfolioData, transactionData] = await Promise.all([
      fetchPortfolioData(user.id),
      fetchTransactionData(user.id)
    ]);

    // Check if data exists
    const hasPortfolio = portfolioData && portfolioData.length > 0;
    const hasTransactions = transactionData && transactionData.length > 0;

    if (!hasPortfolio && !hasTransactions) {
      return {
        success: false,
        message: 'No Data to Export'
      };
    }

    // Define CSV headers
    const portfolioHeaders = [
      { key: 'coin_name', label: 'Coin Name' },
      { key: 'symbol', label: 'Symbol' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'buy_price', label: 'Buy Price' },
      { key: 'current_price', label: 'Current Price' },
      { key: 'total_value', label: 'Total Value' },
      { key: 'profit_loss', label: 'Profit/Loss' },
      { key: 'created_at', label: 'Created At' }
    ];

    const transactionHeaders = [
      { key: 'type', label: 'Type' },
      { key: 'coin', label: 'Coin' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'price', label: 'Price' },
      { key: 'total', label: 'Total' },
      { key: 'created_at', label: 'Date' }
    ];

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().split('T')[0];

    // Export as separate files
    if (hasPortfolio) {
      const portfolioCSV = convertToCSV(portfolioData, portfolioHeaders);
      downloadCSV(`portfolio_${timestamp}.csv`, portfolioCSV);
    }

    if (hasTransactions) {
      const transactionCSV = convertToCSV(transactionData, transactionHeaders);
      downloadCSV(`transactions_${timestamp}.csv`, transactionCSV);
    }

    return {
      success: true,
      message: 'CSV Downloaded Successfully'
    };

  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    return {
      success: false,
      message: error.message || 'Failed to export CSV'
    };
  }
};
