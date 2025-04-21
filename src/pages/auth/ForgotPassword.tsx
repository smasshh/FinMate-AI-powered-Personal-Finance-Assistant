
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    // Here we'll connect to Supabase auth when it's integrated
    // For now, simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      console.log("Password reset requested for:", email);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link to="/login" className="text-gray-600 hover:text-finance-blue flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Login
        </Link>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-finance-blue text-white flex items-center justify-center font-bold text-xl mb-4">F</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-600 mt-1">
            {isSubmitted 
              ? "Check your email for a reset link" 
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-green-800 text-sm">
              We've sent a password reset link to <strong>{email}</strong>. Please check your email.
            </div>
            
            <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
              Try another email
            </Button>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-finance-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
