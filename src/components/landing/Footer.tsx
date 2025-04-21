
import { FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">FinMate</h3>
            <p className="mb-4 text-sm text-gray-400">
              The all-in-one platform for personal finance management, budgeting, investment tracking, and financial insights.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <LinkedinIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Budgeting</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Expense Tracking</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Stock Trading</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Credit Score</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center md:flex md:justify-between md:text-left">
          <p>© 2025 FinMate. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a> | 
            <a href="#" className="hover:text-white transition-colors ml-4">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
