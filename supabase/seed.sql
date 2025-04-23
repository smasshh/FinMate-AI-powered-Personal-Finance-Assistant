-- This is sample data for testing. In a production app, you would NOT include this.
-- For demonstration only, we'll use a specific test user ID
-- Replace 'YOUR_TEST_USER_ID' with an actual user ID when running this manually
INSERT INTO accounts (user_id, name, type, balance)
VALUES 
  ('YOUR_TEST_USER_ID', 'Primary Checking', 'checking', 15000),
  ('YOUR_TEST_USER_ID', 'Savings', 'savings', 100000),
  ('YOUR_TEST_USER_ID', 'Credit Card', 'credit', -7500);

-- Add budget categories
INSERT INTO budgets (user_id, category, amount, period)
VALUES 
  ('YOUR_TEST_USER_ID', 'Housing', 20000, 'monthly'),
  ('YOUR_TEST_USER_ID', 'Food', 8000, 'monthly'),
  ('YOUR_TEST_USER_ID', 'Transport', 5000, 'monthly'),
  ('YOUR_TEST_USER_ID', 'Entertainment', 3000, 'monthly'),
  ('YOUR_TEST_USER_ID', 'Utilities', 4000, 'monthly');

-- Add some expenses
INSERT INTO expenses (user_id, description, amount, date, category)
VALUES 
  ('YOUR_TEST_USER_ID', 'Rent Payment', 18000, NOW() - INTERVAL '15 days', 'Housing'),
  ('YOUR_TEST_USER_ID', 'Grocery Shopping', 2500, NOW() - INTERVAL '10 days', 'Food'),
  ('YOUR_TEST_USER_ID', 'Restaurant Dinner', 1500, NOW() - INTERVAL '5 days', 'Food'),
  ('YOUR_TEST_USER_ID', 'Petrol', 1200, NOW() - INTERVAL '7 days', 'Transport'),
  ('YOUR_TEST_USER_ID', 'Movie Tickets', 800, NOW() - INTERVAL '3 days', 'Entertainment'),
  ('YOUR_TEST_USER_ID', 'Electricity Bill', 2200, NOW() - INTERVAL '12 days', 'Utilities'),
  ('YOUR_TEST_USER_ID', 'Water Bill', 800, NOW() - INTERVAL '12 days', 'Utilities');

-- Add transactions
INSERT INTO transactions (user_id, account_id, description, amount, date, category)
VALUES 
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Salary Deposit', 65000, NOW() - INTERVAL '20 days', 'Income'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Rent Payment', -18000, NOW() - INTERVAL '15 days', 'Housing'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Grocery Shopping', -2500, NOW() - INTERVAL '10 days', 'Food'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'credit' LIMIT 1), 'Restaurant Dinner', -1500, NOW() - INTERVAL '5 days', 'Food'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Petrol', -1200, NOW() - INTERVAL '7 days', 'Transport'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Transfer to Savings', -10000, NOW() - INTERVAL '8 days', 'Transfer'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'savings' LIMIT 1), 'Transfer from Checking', 10000, NOW() - INTERVAL '8 days', 'Transfer'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'credit' LIMIT 1), 'Movie Tickets', -800, NOW() - INTERVAL '3 days', 'Entertainment'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Electricity Bill', -2200, NOW() - INTERVAL '12 days', 'Utilities'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM accounts WHERE user_id = 'YOUR_TEST_USER_ID' AND type = 'checking' LIMIT 1), 'Water Bill', -800, NOW() - INTERVAL '12 days', 'Utilities');

-- Add investments
INSERT INTO investments (user_id, symbol, description, purchase_price, current_value, previous_value, quantity, purchase_date)
VALUES 
  ('YOUR_TEST_USER_ID', 'RELIANCE.NSE', 'Reliance Industries', 2000, 2500, 2200, 10, NOW() - INTERVAL '90 days'),
  ('YOUR_TEST_USER_ID', 'INFY.NSE', 'Infosys Ltd', 1400, 1350, 1400, 15, NOW() - INTERVAL '60 days'),
  ('YOUR_TEST_USER_ID', 'HDFC.NSE', 'HDFC Bank Ltd', 1500, 1600, 1480, 12, NOW() - INTERVAL '45 days'),
  ('YOUR_TEST_USER_ID', 'TCS.NSE', 'Tata Consultancy Services', 3200, 3500, 3300, 5, NOW() - INTERVAL '30 days');

-- Create a sample credit score
INSERT INTO credit_scores (user_id, score, category, payment_history, credit_utilization, credit_age_years, account_types, recent_inquiries, total_balance, annual_income)
VALUES 
  ('YOUR_TEST_USER_ID', 745, 'Very Good', 'excellent', 20, 7, 'diverse', 1, 107500, 780000);

-- Add some credit score recommendations
INSERT INTO credit_score_recommendations (user_id, credit_score_id, title, impact, timeline)
VALUES 
  ('YOUR_TEST_USER_ID', (SELECT id FROM credit_scores WHERE user_id = 'YOUR_TEST_USER_ID' LIMIT 1), 'Keep credit utilization below 30%', 'Maintaining low utilization demonstrates responsible credit management and can improve your score by 20-30 points.', 'You should see improvements within 1-2 billing cycles after reducing balances.'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM credit_scores WHERE user_id = 'YOUR_TEST_USER_ID' LIMIT 1), 'Continue making on-time payments', 'Your excellent payment history contributes significantly to your credit score. Maintaining this pattern protects your score from drops of 80-100 points due to late payments.', 'This is an ongoing benefit that strengthens with time.'),
  ('YOUR_TEST_USER_ID', (SELECT id FROM credit_scores WHERE user_id = 'YOUR_TEST_USER_ID' LIMIT 1), 'Avoid new credit applications', 'Each new inquiry can lower your score by 5-10 points. With only 1 recent inquiry, you're in good shape, but be selective about new applications.', 'The impact of inquiries diminishes after 12 months and they're completely removed after 24 months.'); 