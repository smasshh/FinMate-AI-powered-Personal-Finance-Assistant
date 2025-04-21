
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 rounded bg-finance-blue text-white flex items-center justify-center font-bold text-lg mr-2">F</div>
              <span className="text-xl font-bold text-gray-900">FinMate</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-gray-600 hover:text-finance-blue transition-colors">Features</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-finance-blue transition-colors">Pricing</Link>
            <Link to="/about" className="text-gray-600 hover:text-finance-blue transition-colors">About</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/#features" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-finance-blue hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              to="/#pricing" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-finance-blue hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-finance-blue hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5 space-x-3">
              <Link 
                to="/login" 
                className="block w-full px-3 py-2 rounded-md text-center text-base font-medium text-gray-600 hover:text-finance-blue hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="block w-full px-3 py-2 rounded-md text-center text-base font-medium bg-finance-blue text-white hover:bg-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
