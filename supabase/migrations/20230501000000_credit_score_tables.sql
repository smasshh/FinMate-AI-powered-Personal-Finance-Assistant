-- Create credit_scores table to store user credit score data
CREATE TABLE IF NOT EXISTS credit_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 300 AND score <= 850),
  category TEXT NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Credit factors
  payment_history TEXT,
  credit_utilization INTEGER CHECK (credit_utilization >= 0 AND credit_utilization <= 100),
  credit_age_years INTEGER CHECK (credit_age_years >= 0),
  account_types TEXT,
  recent_inquiries INTEGER CHECK (recent_inquiries >= 0),
  total_balance DECIMAL,
  annual_income DECIMAL
);

-- Create RLS policies for credit_scores table
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own credit scores
CREATE POLICY "Users can view their own credit scores"
ON credit_scores
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to insert their own credit scores
CREATE POLICY "Users can insert their own credit scores"
ON credit_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own credit scores
CREATE POLICY "Users can update their own credit scores"
ON credit_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Create credit_score_history table to track changes over time
CREATE TABLE IF NOT EXISTS credit_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 300 AND score <= 850),
  category TEXT NOT NULL,
  record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Factors at the time
  payment_history TEXT,
  credit_utilization INTEGER,
  credit_age_years INTEGER,
  account_types TEXT,
  recent_inquiries INTEGER,
  total_balance DECIMAL,
  annual_income DECIMAL
);

-- Create RLS policies for credit_score_history table
ALTER TABLE credit_score_history ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own credit score history
CREATE POLICY "Users can view their own credit score history"
ON credit_score_history
FOR SELECT
USING (auth.uid() = user_id);

-- Function to add a record to history whenever credit score is updated
CREATE OR REPLACE FUNCTION add_credit_score_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_score_history (
    user_id, 
    score, 
    category, 
    payment_history, 
    credit_utilization, 
    credit_age_years, 
    account_types, 
    recent_inquiries, 
    total_balance, 
    annual_income
  ) VALUES (
    NEW.user_id,
    NEW.score,
    NEW.category,
    NEW.payment_history,
    NEW.credit_utilization,
    NEW.credit_age_years,
    NEW.account_types,
    NEW.recent_inquiries,
    NEW.total_balance,
    NEW.annual_income
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add history record on insert or update
CREATE TRIGGER credit_score_history_trigger
AFTER INSERT OR UPDATE ON credit_scores
FOR EACH ROW
EXECUTE FUNCTION add_credit_score_history();

-- Create credit_score_recommendations table for AI-generated recommendations
CREATE TABLE IF NOT EXISTS credit_score_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_score_id UUID REFERENCES credit_scores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  impact TEXT NOT NULL,
  timeline TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for credit_score_recommendations table
ALTER TABLE credit_score_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own recommendations
CREATE POLICY "Users can view their own credit score recommendations"
ON credit_score_recommendations
FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_credit_scores_user_id ON credit_scores(user_id);
CREATE INDEX idx_credit_score_history_user_id ON credit_score_history(user_id);
CREATE INDEX idx_credit_score_recommendations_user_id ON credit_score_recommendations(user_id); 