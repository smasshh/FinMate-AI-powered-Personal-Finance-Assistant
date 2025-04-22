
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Fetch API keys from environment
const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY')!;
const ALPACA_SECRET_KEY = Deno.env.get('ALPACA_SECRET_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alpaca Trading API Base URL (paper trading)
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';

async function executeTrade(userId: string, symbol: string, quantity: number, side: 'buy' | 'sell') {
  try {
    const tradeResponse = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: symbol,
        qty: quantity,
        side: side,
        type: 'market',
        time_in_force: 'gtc'
      })
    });

    const orderData = await tradeResponse.json();

    return {
      success: tradeResponse.ok,
      orderId: orderData.id,
      status: orderData.status,
      filledPrice: orderData.filled_avg_price
    };
  } catch (error) {
    console.error('Trade execution error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function getPortfolioPositions() {
  try {
    const positionsResponse = await fetch(`${ALPACA_BASE_URL}/v2/positions`, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
      }
    });

    return await positionsResponse.json();
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, userId, symbol, quantity, side } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch(action) {
      case 'EXECUTE_TRADE':
        const tradeResult = await executeTrade(userId, symbol, quantity, side);
        
        if (tradeResult.success) {
          // Store trade in Supabase
          const { error } = await supabase
            .from('user_trades')
            .insert({
              user_id: userId,
              symbol: symbol,
              quantity: quantity,
              trade_type: side,
              price_at_execution: Number(tradeResult.filledPrice || 0),
              alpaca_order_id: tradeResult.orderId,
              status: tradeResult.status
            });

          if (error) console.error('Supabase trade insert error:', error);
        }

        return new Response(JSON.stringify(tradeResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'GET_PORTFOLIO':
        const positions = await getPortfolioPositions();
        
        // Optional: Store portfolio snapshot
        const portfolioValue = positions.reduce((total, pos) => 
          total + (Number(pos.market_value) || 0), 0);
        
        const { error: snapshotError } = await supabase
          .from('portfolio_snapshots')
          .insert({
            user_id: userId,
            portfolio_value: portfolioValue,
            positions_data: JSON.stringify(positions)
          });

        if (snapshotError) console.error('Portfolio snapshot error:', snapshotError);

        return new Response(JSON.stringify(positions), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Trade Assistant Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

