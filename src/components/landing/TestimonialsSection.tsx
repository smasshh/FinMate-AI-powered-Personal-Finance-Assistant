
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Small Business Owner",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    content: "FinMate completely changed how I manage both my personal and business finances. The budget tracking has helped me save 20% more each month!",
    stars: 5
  },
  {
    name: "Michael Chen",
    role: "Software Engineer",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    content: "The investment tracking features are incredible. I can finally see all my assets in one place and make better decisions with the AI recommendations.",
    stars: 5
  },
  {
    name: "Jessica Miller",
    role: "Marketing Director",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    content: "I've tried many finance apps before, but FinMate's user experience and comprehensive features are unmatched. The credit score predictions are surprisingly accurate!",
    stars: 4
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of users who have transformed their financial lives with FinMate.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-5 h-5 ${i < testimonial.stars ? 'text-finance-gold fill-finance-gold' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-4">Ready to transform your finances?</p>
          <button className="bg-finance-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
