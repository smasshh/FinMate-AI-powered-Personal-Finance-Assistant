
import { 
  BarChart3, 
  CreditCard, 
  LineChart, 
  TrendingUp, 
  Brain 
} from "lucide-react";

const features = [
  {
    title: "Smart Budgeting",
    description: "Create and manage your budgets across multiple categories. Get notified when you're approaching your limits.",
    icon: <BarChart3 className="w-10 h-10 text-finance-blue" />
  },
  {
    title: "Expense Tracking",
    description: "Track all your expenses automatically. Categorize and analyze spending patterns to identify saving opportunities.",
    icon: <CreditCard className="w-10 h-10 text-finance-green" />
  },
  {
    title: "Stock Trading",
    description: "Buy and sell stocks with real-time market data. Monitor your portfolio performance over time.",
    icon: <TrendingUp className="w-10 h-10 text-finance-gold" />
  },
  {
    title: "Investment Analysis",
    description: "Get detailed insights on your investments. View performance metrics and diversification analysis.",
    icon: <LineChart className="w-10 h-10 text-finance-blue" />
  },
  {
    title: "AI Financial Assistant",
    description: "Get personalized financial advice and insights powered by artificial intelligence.",
    icon: <Brain className="w-10 h-10 text-finance-green" />
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-white" id="features">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">All-in-One Financial Management</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your finances in one place - from everyday expenses to long-term investments.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-8 transition-all hover:shadow-md border border-gray-100">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
