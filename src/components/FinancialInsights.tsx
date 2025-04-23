import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, ArrowRight, Lightbulb, Eye } from 'lucide-react';
import { useFinancialInsights } from '@/hooks/useFinancialInsights';

export const FinancialInsights = () => {
  const { data: insights, isLoading, error } = useFinancialInsights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-finance-blue" />
            AI Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-finance-blue border-t-transparent"></div>
              <p className="mt-4 text-sm text-muted-foreground">Analyzing your financial data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  // Format insights text by removing special characters and organizing into sections
  const formatInsights = (text: string) => {
    if (!text) return [];

    // Remove markdown characters and split by newlines
    const cleaned = text
      .replace(/[*#]/g, '') // Remove * and # characters
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();

    // Split into sections
    const sections = [];
    let currentSection = { title: 'Summary', content: [] };

    cleaned.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return; // Skip empty lines
      
      // Check if this is a section title
      if (trimmedLine.endsWith(':') && trimmedLine.length < 45) {
        if (currentSection.content.length > 0) {
          sections.push({ ...currentSection });
        }
        currentSection = { title: trimmedLine.replace(':', ''), content: [] };
      } else if (trimmedLine.startsWith('1.') || trimmedLine.startsWith('2.') || 
                 trimmedLine.startsWith('3.') || trimmedLine.startsWith('4.')) {
        // Handle numbered lists by adding them as a new bullet point
        currentSection.content.push(trimmedLine.replace(/^\d+\.\s*/, '').trim());
      } else {
        // Regular content
        currentSection.content.push(trimmedLine);
      }
    });

    // Add the last section
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  const insightSections = formatInsights(insights);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-finance-blue" />
          AI Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {insightSections.map((section, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center">
                {index === 0 ? (
                  <Eye className="h-4 w-4 mr-2 text-finance-blue" />
                ) : index === 1 ? (
                  <TrendingUp className="h-4 w-4 mr-2 text-finance-blue" />
                ) : index === 2 ? (
                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2 text-green-500" />
                )}
                <h3 className="font-semibold text-lg">{section.title}</h3>
              </div>
              <div className="pl-6 space-y-2">
                {section.content.map((line, i) => (
                  <p key={i} className="text-sm leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Powered by AI analysis
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
