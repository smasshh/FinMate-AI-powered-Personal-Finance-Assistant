import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use the provided Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = 'NIJJN2YD7WGHXYQ6';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getRecommendation(currentPrice: number, predictedPrice: number, volatility: number) {
  const percentChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
  const confidenceScore = Math.max(0, Math.min(1, 1 - volatility * 10));
  
  let recommendation = 'HOLD';
  let riskLevel = 'MEDIUM';

  if (percentChange > 5) {
    recommendation = 'BUY';
    riskLevel = confidenceScore > 0.75 ? 'LOW' : 'MEDIUM';
  } else if (percentChange < -5) {
    recommendation = 'SELL';
    riskLevel = confidenceScore > 0.75 ? 'HIGH' : 'MEDIUM';
  }

  return { 
    recommendation, 
    riskLevel, 
    confidenceScore,
    percentChange
  };
}

async function getStockPrice(symbol: string): Promise<number> {
  try {
    console.log(`Fetching stock price for ${symbol} from Alpha Vantage`);
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      console.log(`Alpha Vantage price for ${symbol}: ${data['Global Quote']['05. price']}`);
      return parseFloat(data['Global Quote']['05. price']);
    }
    
    // If we reach here, Alpha Vantage didn't give us a price, so we use a fallback
    console.log(`No price data available from API for ${symbol}, using fallback prices`);
    
    // Provide realistic fallback prices for common stocks to support simulation
    const fallbackPrices: Record<string, number> = {
      // US Tech
      'AAPL': 175.50,
      'MSFT': 410.25,
      'GOOGL': 172.85,
      'AMZN': 185.35,
      'META': 495.40,
      'TSLA': 175.40,
      'NVDA': 950.30,
      'AMD': 157.25,
      'INTC': 30.45,
      // US Financial
      'JPM': 192.75,
      'BAC': 38.20,
      'GS': 450.30,
      'WFC': 57.15,
      'V': 275.80,
      'MA': 455.20,
      // Indian Tech
      'INFY': 1455.20, 
      'TCS.NS': 3910.50,
      'WIPRO.NS': 475.25,
      'TECHM.NS': 1285.65,
      // Indian Financial
      'HDFCBANK.NS': 1595.75,
      'ICICIBANK.NS': 1055.40,
      'SBIN.NS': 795.25,
      'AXISBANK.NS': 1125.50
    };
    
    // Return the fallback price or generate a random one based on the symbol string
    const price = fallbackPrices[symbol] || 
      // Generate a pseudo-random price between 50 and 5000 based on the symbol string
      (50 + (Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4950));
    
    console.log(`Using fallback price for ${symbol}: $${price}`);
    return price;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    
    // On error, use the same fallback mechanism
    const hashCode = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const fallbackPrice = 50 + (hashCode % 4950);
    
    console.log(`Error fetching price, using generated fallback for ${symbol}: $${fallbackPrice}`);
    return fallbackPrice;
  }
}

// Mock data for fallback
const mockIndices = [
  {
    symbol: 'NSEI',
    price: '22456.80',
    change: '143.21',
    changePercent: '0.64%',
    isPositive: true
  },
  {
    symbol: 'BSESN',
    price: '73648.30',
    change: '456.78',
    changePercent: '0.62%',
    isPositive: true
  },
  {
    symbol: 'NIFMDCP50.NS',
    price: '12567.40',
    change: '-56.70',
    changePercent: '-0.45%',
    isPositive: false
  },
  {
    symbol: 'NIFTY_IT.NS',
    price: '33456.70',
    change: '123.45',
    changePercent: '0.37%',
    isPositive: true
  }
];

async function fetchIndexData(symbol: string) {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }
    
    if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
      throw new Error('No data available');
    }
    
    const quote = data['Global Quote'];
    return {
      symbol,
      price: quote['05. price'],
      change: quote['09. change'],
      changePercent: quote['10. change percent'],
      isPositive: parseFloat(quote['09. change']) >= 0
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action, useMockData } = requestData;
    
    if (action !== 'MARKET_INDICES') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (useMockData) {
      return new Response(
        JSON.stringify({ indices: mockIndices }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define the market indices we want to track
    const symbols = ['NSEI', 'BSESN', 'NIFMDCP50.NS', 'NIFTY_IT.NS'];
    const indices = [];

    // Fetch real data for each index
    for (const symbol of symbols) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || data['Note']);
      }

      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = quote['10. change percent'];

        indices.push({
          symbol,
          price: price.toFixed(2),
          change: change.toFixed(2),
          changePercent,
          isPositive: change >= 0
        });
      }
    }

    return new Response(
      JSON.stringify({ indices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
