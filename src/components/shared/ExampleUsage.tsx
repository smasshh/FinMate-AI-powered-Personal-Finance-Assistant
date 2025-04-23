import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AIRecommendations, { Recommendation } from './AIRecommendations';

const ExampleUsage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Example recommendations data
  const sampleRecommendations: Recommendation[] = [
    {
      title: "Create an emergency fund",
      impact: "Having 3-6 months of expenses saved can protect you from unexpected financial shocks.",
      timeline: "Start with small monthly contributions and aim to build this over 6-12 months."
    },
    {
      title: "Reduce discretionary spending",
      impact: "Cutting non-essential expenses by 20% could save you approximately ₹5,000 per month.",
      timeline: "Implement immediately and maintain for at least 3 months to see significant results."
    },
    {
      title: "Consolidate high-interest debt",
      impact: "By transferring high-interest debt to a lower-interest option, you could save ₹10,000 in interest annually.",
      timeline: "Research options this month and make the transfer within 30 days."
    }
  ];

  const handleGetRecommendations = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setRecommendations(sampleRecommendations);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Financial Recommendations</h3>
        <Button 
          variant="outline"
          onClick={handleGetRecommendations}
          disabled={loading}
        >
          Get AI Recommendations
        </Button>
      </div>

      <AIRecommendations 
        recommendations={recommendations}
        loading={loading}
        sourceText="These recommendations are based on your current spending patterns and financial goals."
      />
    </div>
  );
};

export default ExampleUsage; 