import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI SDK
// You need to provide an API key as an environment variable
const API_KEY = import.meta.env.VITE_NEXT_PUBLIC_GEMINI_API_KEY || '';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Interface for Credit Score User Data
export interface CreditScoreData {
  paymentHistory: string;
  creditUtilization: number;
  creditAgeYears: number;
  accountTypes: string;
  recentInquiries: number;
  balance: number;
  income: number;
  creditScore: number;
  scoreCategory: string;
}

// Interface for structured recommendation
export interface CreditRecommendation {
  title: string;
  impact: string;
  timeline: string;
}

/**
 * Get personalized suggestions to improve credit score using Gemini API
 */
export async function getCreditScoreSuggestions(data: CreditScoreData): Promise<CreditRecommendation[]> {
  try {
    // Return mock suggestions if API key is not available
    if (!API_KEY) {
      console.warn('Gemini API key is not provided. Using mock suggestions.');
      return getMockSuggestions(data);
    }

    console.log('Using Gemini API with key:', API_KEY.substring(0, 5) + '...' + API_KEY.substring(API_KEY.length - 4));

    // Get the generative model (Gemini 1.5 Pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Create a prompt that requests personalized, understandable recommendations
    const prompt = `
    I need personalized, meaningful suggestions to improve this person's credit score.
    
    Current financial situation:
    - Credit Score: ${data.creditScore} (${data.scoreCategory})
    - Payment History: ${data.paymentHistory}
    - Credit Utilization: ${data.creditUtilization}%
    - Credit Age: ${data.creditAgeYears} years
    - Account Mix: ${data.accountTypes}
    - Recent Inquiries: ${data.recentInquiries}
    - Total Balance: ₹${data.balance}
    - Annual Income: ₹${data.income}
    
    Please provide 3-4 specific, clear recommendations that are DIRECTLY RELEVANT to this person's situation.
    Use this format for each recommendation:
    
    - TITLE: [Clear action statement, 5-10 words]
    - IMPACT: [1-2 sentences explaining specifically how this will improve their score and why it matters]
    - TIMELINE: [When they might see results, be specific about timeframe]
    
    Focus on the biggest problems in their profile. Make recommendations proportional to the severity of issues.
    Be specific - mention actual numbers and percentages when relevant.
    Emphasize the MOST impactful changes first.
    `;

    console.log('Sending request to Gemini API with model: gemini-1.5-pro');

    try {
      // Generate content using the model
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('Received response from Gemini API:', text.substring(0, 100) + '...');

      // Parse the structured response into recommendation objects
      const recommendations: CreditRecommendation[] = [];
      const sections = text.split(/(?=- TITLE:|^\s*-\s*TITLE:)/gm)
        .filter(section => section.trim().length > 0);
      
      for (const section of sections) {
        try {
          const titleMatch = section.match(/(?:TITLE:|title:)\s*(.+?)(?=\s*-\s*IMPACT:|$)/i);
          const impactMatch = section.match(/(?:IMPACT:|impact:)\s*(.+?)(?=\s*-\s*TIMELINE:|$)/i);
          const timelineMatch = section.match(/(?:TIMELINE:|timeline:)\s*(.+?)(?=\s*-\s*TITLE:|$)/i);
          
          if (titleMatch && titleMatch[1]) {
            const recommendation: CreditRecommendation = {
              title: titleMatch[1].trim(),
              impact: impactMatch && impactMatch[1] ? impactMatch[1].trim() : "",
              timeline: timelineMatch && timelineMatch[1] ? timelineMatch[1].trim() : ""
            };
            recommendations.push(recommendation);
          }
        } catch (parseError) {
          console.warn('Error parsing recommendation section:', parseError);
        }
      }

      if (recommendations.length === 0) {
        console.warn('No structured recommendations found in Gemini response, using fallback suggestions');
        return getMockSuggestions(data);
      }

      return recommendations;
    } catch (generateError) {
      console.error('Error generating content:', generateError);
      throw generateError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error('Error getting suggestions from Gemini (falling back to mock suggestions):', error);
    return getMockSuggestions(data);
  }
}

/**
 * Get mock suggestions when Gemini API is not available
 */
function getMockSuggestions(data: CreditScoreData): CreditRecommendation[] {
  const suggestions: CreditRecommendation[] = [];

  // Payment history suggestions
  if (data.paymentHistory !== 'excellent') {
    suggestions.push({
      title: "Set up automatic payments for all bills",
      impact: "Payment history makes up 35% of your score. Automating payments ensures you'll never miss a due date, which can prevent future score drops of 80-100 points from late payments.",
      timeline: "Your score should start improving within 3-6 months as you build a consistent on-time payment history."
    });
  }

  // Credit utilization suggestions
  if (data.creditUtilization > 30) {
    suggestions.push({
      title: "Reduce credit utilization below 30%",
      impact: `Your current utilization of ${data.creditUtilization}% is hurting your score. Lowering it below 30% can boost your score by 20-40 points since utilization accounts for 30% of your total score.`,
      timeline: "You may see improvement as soon as your next statement closing date after reducing balances."
    });
  }

  // Credit age suggestions
  if (data.creditAgeYears < 5) {
    suggestions.push({
      title: "Maintain oldest credit accounts",
      impact: `With only ${data.creditAgeYears} years of credit history, you need to nurture account age. Keep your oldest accounts open and active with small, regular purchases to strengthen the 15% of your score based on length of history.`,
      timeline: "This is a long-term strategy; each year adds value to your credit age, gradually improving your score."
    });
  }

  // Account mix suggestions
  if (data.accountTypes !== 'diverse') {
    suggestions.push({
      title: "Diversify your credit account types",
      impact: "Your limited account mix is restricting 10% of your score potential. Adding a different type of credit (installment loan or credit card) demonstrates you can manage various credit responsibilities responsibly.",
      timeline: "Allow 6-12 months for new accounts to mature and positively impact your score by 10-20 points."
    });
  }

  // Recent inquiries suggestions
  if (data.recentInquiries > 2) {
    suggestions.push({
      title: "Pause new credit applications",
      impact: `Your ${data.recentInquiries} recent inquiries are reducing your score. Each hard inquiry can lower it by 5-10 points and signals risk to lenders. Avoiding new applications will stabilize this factor.`,
      timeline: "The negative impact of inquiries diminishes after 12 months and they're removed completely after 24 months."
    });
  }

  // Balance to income ratio suggestions
  const dti = (data.balance / data.income) * 100;
  if (dti > 30) {
    suggestions.push({
      title: "Create a debt reduction plan",
      impact: `Your debt-to-income ratio of ${Math.round(dti)}% is high compared to the recommended maximum of 30%. While not directly part of your credit score, lenders view high DTI as risky, affecting loan approvals and terms.`,
      timeline: "Commit to a 6-month debt reduction plan and track monthly progress. Lower DTI will improve approval odds on future applications."
    });
  }

  // If we have too few suggestions, add a general one
  if (suggestions.length < 3) {
    suggestions.push({
      title: "Review your credit reports for errors",
      impact: "Up to 25% of credit reports contain errors that could be lowering your score. Disputing inaccuracies like incorrect late payments or account balances might boost your score by 20+ points.",
      timeline: "Most disputes are resolved within 30 days, with score improvements appearing immediately after corrections are made."
    });
  }

  // Limit to 4 most impactful suggestions
  return suggestions.slice(0, 4);
} 