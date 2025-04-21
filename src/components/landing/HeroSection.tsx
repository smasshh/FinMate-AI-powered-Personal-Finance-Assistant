
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-blue-50">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-finance-dark">
              Take Control of Your
              <span className="text-finance-blue"> Financial Future</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-600 max-w-md">
              All-in-one platform for budgeting, expense tracking, investments, and AI-powered financial insights.
            </p>
            <div className="flex space-x-4">
              <Button size="lg" className="px-8">
                Sign Up Free
              </Button>
              <Button variant="outline" size="lg" className="px-8 group">
                Try Demo <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="FinMate Dashboard Preview" 
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-finance-gold text-white px-6 py-2 rounded-lg shadow-lg text-sm font-medium">
                Powered by AI
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Abstract shapes */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-finance-blue/10 rounded-full blur-3xl"></div>
      <div className="absolute top-20 -right-20 w-72 h-72 bg-finance-green/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default HeroSection;
