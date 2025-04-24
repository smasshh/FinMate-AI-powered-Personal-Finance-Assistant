# FinMate - Financial Management Application

FinMate is a comprehensive financial management application that helps users track their expenses, manage budgets, and get real-time market insights.

## Features

- **Expense Tracking**: Track and categorize your daily expenses
- **Budget Management**: Set and monitor monthly budgets
- **Market Insights**: Real-time stock market data and predictions
- **Financial Analytics**: Visualize your spending patterns and financial health
- **User Authentication**: Secure login and profile management

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions)
- **APIs**: Alpha Vantage (Stock Market Data)
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/finmate.git
cd finmate
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
finmate/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # React contexts
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── supabase/
│   └── functions/     # Edge functions
└── public/            # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@finmate.com or join our Slack channel.
