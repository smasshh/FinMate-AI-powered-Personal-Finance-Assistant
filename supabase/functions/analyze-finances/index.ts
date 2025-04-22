
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const PROJECT_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Processing request for user: ${userId}`);

    // Fetch user's financial data
    const expensesResponse = await fetch(`${PROJECT_URL}/rest/v1/expenses?user_id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
    });
    
    if (!expensesResponse.ok) {
      const errorText = await expensesResponse.text();
      console.error(`Error fetching expenses: ${errorText}`);
      throw new Error(`Error fetching expenses: ${expensesResponse.status}`);
    }
    
    const expenses = await expensesResponse.json();
    console.log(`Retrieved ${expenses.length} expenses`);

    const budgetsResponse = await fetch(`${PROJECT_URL}/rest/v1/budgets?user_id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
    });
    
    if (!budgetsResponse.ok) {
      const errorText = await budgetsResponse.text();
      console.error(`Error fetching budgets: ${errorText}`);
      throw new Error(`Error fetching budgets: ${budgetsResponse.status}`);
    }
    
    const budgets = await budgetsResponse.json();
    console.log(`Retrieved ${budgets.length} budgets`);

    // Prepare data for Gemini
    const prompt = `
    Analyze the following financial data and provide budget recommendations:
    
    Expenses: ${JSON.stringify(expenses)}
    Budgets: ${JSON.stringify(budgets)}
    
    Please provide:
    1. Spending trend analysis
    2. Category-wise budget recommendations
    3. Tips to optimize spending
    4. Potential areas for budget adjustments
    Keep the response concise, actionable, and under 300 words.
    `;

    console.log("Calling Gemini API");
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Error from Gemini API: ${errorText}`);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const analysis = await geminiResponse.json();
    
    if (!analysis.candidates || !analysis.candidates[0] || !analysis.candidates[0].content || !analysis.candidates[0].content.parts || !analysis.candidates[0].content.parts[0]) {
      console.error("Unexpected Gemini API response structure:", JSON.stringify(analysis));
      throw new Error("Invalid response from Gemini API");
    }
    
    const insights = analysis.candidates[0].content.parts[0].text;
    console.log("Successfully generated insights");

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in analyze-finances function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
