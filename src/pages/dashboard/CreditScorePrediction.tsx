import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle, ArrowRight, Loader2, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { getCreditScoreSuggestions, CreditScoreData, CreditRecommendation } from '@/lib/gemini';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Credit score calculation factors and weights
const CREDIT_FACTORS = {
  paymentHistory: 0.35,
  creditUtilization: 0.30,
  creditAge: 0.15,
  accountMix: 0.10,
  inquiries: 0.10,
};

// Credit score ranges
const SCORE_RANGES = {
  excellent: { min: 800, max: 850, color: 'bg-green-500' },
  veryGood: { min: 740, max: 799, color: 'bg-emerald-500' },
  good: { min: 670, max: 739, color: 'bg-teal-500' },
  fair: { min: 580, max: 669, color: 'bg-yellow-500' },
  poor: { min: 300, max: 579, color: 'bg-red-500' },
};

const CreditScorePrediction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [scoreCategory, setScoreCategory] = useState<string | null>(null);
  const [scoreColor, setScoreColor] = useState<string>('bg-gray-200');
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<CreditRecommendation[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('score');
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    paymentHistory: 'excellent', // Default values
    creditUtilization: 20,
    creditAgeYears: 5,
    accountTypes: 'diverse',
    recentInquiries: 0,
    balance: 5000,
    income: 60000,
  });

  // Fetch user's latest credit score data when component mounts
  useEffect(() => {
    if (user) {
      fetchUserCreditScore();
    } else {
      setLoadingUserData(false);
    }
  }, [user]);
  
  // Fetch user's latest credit score from Supabase
  const fetchUserCreditScore = async () => {
    try {
      setLoadingUserData(true);
      
      const { data, error } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching credit score:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const latestScore = data[0];
        
        // Update form data with the latest saved values
        setFormData({
          paymentHistory: latestScore.payment_history || 'excellent',
          creditUtilization: latestScore.credit_utilization || 20,
          creditAgeYears: latestScore.credit_age_years || 5,
          accountTypes: latestScore.account_types || 'diverse',
          recentInquiries: latestScore.recent_inquiries || 0,
          balance: latestScore.total_balance || 5000,
          income: latestScore.annual_income || 60000,
        });
        
        // If there's a previously predicted score, set it
        setCreditScore(latestScore.score);
        setScoreCategory(latestScore.category);
        
        // Set the appropriate color based on category
        if (latestScore.category === 'Excellent') {
          setScoreColor(SCORE_RANGES.excellent.color);
        } else if (latestScore.category === 'Very Good') {
          setScoreColor(SCORE_RANGES.veryGood.color);
        } else if (latestScore.category === 'Good') {
          setScoreColor(SCORE_RANGES.good.color);
        } else if (latestScore.category === 'Fair') {
          setScoreColor(SCORE_RANGES.fair.color);
        } else if (latestScore.category === 'Poor') {
          setScoreColor(SCORE_RANGES.poor.color);
        }
        
        setShowResults(true);
        
        // Fetch saved recommendations
        fetchSavedRecommendations(latestScore.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingUserData(false);
    }
  };
  
  // Fetch saved recommendations for a credit score
  const fetchSavedRecommendations = async (creditScoreId: string) => {
    try {
      setLoadingSuggestions(true);
      
      const { data, error } = await supabase
        .from('credit_score_recommendations')
        .select('*')
        .eq('credit_score_id', creditScoreId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Convert the saved recommendations to the expected format
        const recommendations: CreditRecommendation[] = data.map(rec => ({
          title: rec.title,
          impact: rec.impact,
          timeline: rec.timeline
        }));
        
        setAiSuggestions(recommendations);
      } else {
        // If no saved recommendations, generate new ones
        if (creditScore && scoreCategory) {
          generateAISuggestions();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  // Updates form data
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get AI suggestions when credit score is calculated
  const generateAISuggestions = async () => {
    if (creditScore && scoreCategory) {
      setLoadingSuggestions(true);
      try {
        const data: CreditScoreData = {
          ...formData,
          creditScore,
          scoreCategory
        };
        
        const suggestions = await getCreditScoreSuggestions(data);
        // Update the state
        setAiSuggestions(suggestions);
        // Return the suggestions for immediate use
        return suggestions;
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        toast({
          title: "Error generating recommendations",
          description: "Could not generate AI recommendations. Please try again.",
          variant: "destructive"
        });
        return [];
      } finally {
        setLoadingSuggestions(false);
      }
    }
    return [];
  };
  
  // Calculates a balanced credit score prediction
  const calculateCreditScore = () => {
    setLoading(true);
    
    // Reset suggestions
    setAiSuggestions([]);
    
    // Simulate API call or complex calculation with timeout
    setTimeout(() => {
      // Base score starts at 300 (minimum credit score)
      let baseScore = 300;
      
      // Payment history factor (0-100 points, scaled by weight)
      const paymentHistoryPoints = {
        excellent: 100,
        good: 80,
        fair: 50,
        poor: 20,
        verybad: 0
      }[formData.paymentHistory] || 0;
      
      // Credit utilization (0-100 points, lower is better)
      const utilizationPoints = 100 - Math.min(100, formData.creditUtilization);
      
      // Credit age points (longer history is better, max 100 points)
      const creditAgePoints = Math.min(100, (formData.creditAgeYears / 25) * 100);
      
      // Account mix points (diverse is better)
      const accountMixPoints = {
        diverse: 100,
        moderate: 70,
        limited: 40
      }[formData.accountTypes] || 0;
      
      // Recent inquiries points (fewer is better)
      const inquiriesPoints = Math.max(0, 100 - (formData.recentInquiries * 15));
      
      // Balance to income ratio adjustment
      const balanceToIncomeRatio = formData.income > 0 
        ? (formData.balance / formData.income) : 1;
      const ratioAdjustment = Math.max(-50, Math.min(50, 50 - (balanceToIncomeRatio * 100)));
      
      // Calculate weighted score
      const weightedScore = 
        (paymentHistoryPoints * CREDIT_FACTORS.paymentHistory) +
        (utilizationPoints * CREDIT_FACTORS.creditUtilization) +
        (creditAgePoints * CREDIT_FACTORS.creditAge) +
        (accountMixPoints * CREDIT_FACTORS.accountMix) +
        (inquiriesPoints * CREDIT_FACTORS.inquiries);
      
      // Scale to credit score range (300-850) and apply ratio adjustment
      const calculatedScore = Math.round(baseScore + ((850 - 300) * (weightedScore / 100)) + ratioAdjustment);
      const finalScore = Math.min(850, Math.max(300, calculatedScore));
      
      // Determine category
      let category;
      let color;
      
      if (finalScore >= SCORE_RANGES.excellent.min) {
        category = 'Excellent';
        color = SCORE_RANGES.excellent.color;
      } else if (finalScore >= SCORE_RANGES.veryGood.min) {
        category = 'Very Good';
        color = SCORE_RANGES.veryGood.color;
      } else if (finalScore >= SCORE_RANGES.good.min) {
        category = 'Good';
        color = SCORE_RANGES.good.color;
      } else if (finalScore >= SCORE_RANGES.fair.min) {
        category = 'Fair';
        color = SCORE_RANGES.fair.color;
      } else {
        category = 'Poor';
        color = SCORE_RANGES.poor.color;
      }
      
      setCreditScore(finalScore);
      setScoreCategory(category);
      setScoreColor(color);
      setShowResults(true);
      setLoading(false);
      
      // First, save the credit score immediately if user is logged in
      if (user) {
        // Using type assertion to bypass TypeScript errors with Supabase schema
        (supabase as any)
          .from('credit_scores')
          .insert([{
            user_id: user.id,
            score: finalScore,
            category: category,
            payment_history: formData.paymentHistory,
            credit_utilization: formData.creditUtilization,
            credit_age_years: formData.creditAgeYears,
            account_types: formData.accountTypes,
            recent_inquiries: formData.recentInquiries,
            total_balance: formData.balance,
            annual_income: formData.income
          }])
          .select()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error saving credit score:', error);
              toast({
                title: "Error saving data",
                description: "Could not save your credit score. Please try again.",
                variant: "destructive"
              });
              return;
            }
            
            toast({
              title: "Credit score saved",
              description: "Your credit score has been saved successfully.",
              variant: "default"
            });
            
            // Store the credit score ID for future use with recommendations
            if (data && data.length > 0) {
              const creditScoreId = data[0].id;
              
              // Generate AI suggestions separately
              generateAISuggestions().then((suggestions) => {
                // Use the suggestions directly from the promise return value
                if (suggestions && suggestions.length > 0) {
                  // Using type assertion to bypass TypeScript errors with Supabase schema
                  const recommendationsToInsert = suggestions.map(rec => ({
                    user_id: user.id,
                    credit_score_id: creditScoreId,
                    title: rec.title,
                    impact: rec.impact,
                    timeline: rec.timeline
                  }));
                  
                  (supabase as any)
                    .from('credit_score_recommendations')
                    .insert(recommendationsToInsert)
                    .then(({ error: recError }) => {
                      if (recError) {
                        console.error('Error saving recommendations:', recError);
                      }
                    });
                }
              });
            }
          });
      } else {
        // Just generate suggestions without saving if user is not logged in
        generateAISuggestions();
      }
    }, 1500);
  };
  
  if (loadingUserData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p>Loading your credit score data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Credit Score Prediction</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>
              Enter your financial details for an estimated credit score prediction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentHistory">Payment History</Label>
              <Select 
                value={formData.paymentHistory}
                onValueChange={(value) => handleInputChange('paymentHistory', value)}
              >
                <SelectTrigger id="paymentHistory">
                  <SelectValue placeholder="Select payment history" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - No missed payments</SelectItem>
                  <SelectItem value="good">Good - Few missed payments</SelectItem>
                  <SelectItem value="fair">Fair - Several missed payments</SelectItem>
                  <SelectItem value="poor">Poor - Many missed payments</SelectItem>
                  <SelectItem value="verybad">Very Bad - Defaults</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="utilization">Credit Utilization (%)</Label>
                <span className="text-sm text-muted-foreground">{formData.creditUtilization}%</span>
              </div>
              <Slider
                id="utilization"
                min={0}
                max={100}
                step={1}
                value={[formData.creditUtilization]}
                onValueChange={(values) => handleInputChange('creditUtilization', values[0])}
              />
              <p className="text-xs text-muted-foreground">
                Percentage of your available credit you're using (lower is better)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="creditAge">Credit Age (years)</Label>
              <Input 
                id="creditAge"
                type="number" 
                min={0}
                max={50}
                value={formData.creditAgeYears}
                onChange={(e) => handleInputChange('creditAgeYears', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountTypes">Account Mix</Label>
              <Select 
                value={formData.accountTypes}
                onValueChange={(value) => handleInputChange('accountTypes', value)}
              >
                <SelectTrigger id="accountTypes">
                  <SelectValue placeholder="Select account mix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diverse">Diverse - Multiple account types</SelectItem>
                  <SelectItem value="moderate">Moderate - Few account types</SelectItem>
                  <SelectItem value="limited">Limited - One account type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inquiries">Recent Credit Inquiries (last 2 years)</Label>
              <Input 
                id="inquiries"
                type="number" 
                min={0}
                max={20}
                value={formData.recentInquiries}
                onChange={(e) => handleInputChange('recentInquiries', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balance">Current Total Balance (₹)</Label>
              <Input 
                id="balance"
                type="number" 
                min={0}
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="income">Annual Income (₹)</Label>
              <Input 
                id="income"
                type="number" 
                min={0}
                value={formData.income}
                onChange={(e) => handleInputChange('income', Number(e.target.value))}
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={calculateCreditScore}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              {loading ? 'Calculating...' : 'Predict Credit Score'}
            </Button>
          </CardContent>
        </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
          <CardTitle>Credit Score Analysis</CardTitle>
              {showResults && (
                <Badge variant={creditScore && creditScore >= 670 ? "default" : "destructive"}>
                  {scoreCategory}
                </Badge>
              )}
            </div>
            <CardDescription>
              Your estimated credit score based on the provided information
            </CardDescription>
        </CardHeader>
        <CardContent>
            {!showResults ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <CreditCard className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  Fill in your financial information and click "Predict Credit Score" to see your estimated credit score.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <Progress value={60} className="w-[60%]" />
                <p>Analyzing your financial information...</p>
              </div>
            ) : (
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="score">Score Details</TabsTrigger>
                  <TabsTrigger value="suggestions">
                    AI Suggestions
                    {loadingSuggestions && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="score" className="space-y-6 pt-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className={`relative flex items-center justify-center w-48 h-48 rounded-full ${scoreColor} text-white`}>
                      <span className="text-4xl font-bold">{creditScore}</span>
                    </div>
                    <h3 className="text-2xl font-semibold">{scoreCategory}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Score Breakdown</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Payment History (35%)</span>
                        <span>{formData.paymentHistory.charAt(0).toUpperCase() + formData.paymentHistory.slice(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Credit Utilization (30%)</span>
                        <span>{formData.creditUtilization}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Credit Age (15%)</span>
                        <span>{formData.creditAgeYears} years</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Account Mix (10%)</span>
                        <span>{formData.accountTypes.charAt(0).toUpperCase() + formData.accountTypes.slice(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recent Inquiries (10%)</span>
                        <span>{formData.recentInquiries}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is an estimation based on the information provided and may differ from your actual credit score.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="suggestions" className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-lg">AI-Powered Improvement Plan</h4>
                    {loadingSuggestions && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  
                  {loadingSuggestions ? (
                    <div className="flex flex-col items-center justify-center h-32 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Generating personalized suggestions with Google Gemini AI...
                      </p>
                    </div>
                  ) : aiSuggestions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {aiSuggestions.map((suggestion, index) => (
                          <Card key={index} className="overflow-hidden border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <h5 className="font-semibold text-base mb-3">{suggestion.title}</h5>
                              <div className="grid gap-3 text-sm">
                                <div className="flex items-start">
                                  <div className="bg-muted rounded-full p-1 mr-2 shrink-0 mt-0.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground font-medium mb-1">Impact</p>
                                    <p className="text-sm leading-relaxed">{suggestion.impact}</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="bg-muted rounded-full p-1 mr-2 shrink-0 mt-0.5">
                                    <Clock className="h-3.5 w-3.5 text-secondary" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground font-medium mb-1">Timeline</p>
                                    <p className="text-sm leading-relaxed">{suggestion.timeline}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <Alert variant="default" className="mt-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          These personalized recommendations are generated by Google's Gemini AI based on your specific financial situation.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        No AI suggestions available. Please check your API key configuration.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default CreditScorePrediction;
