-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_transactions INTEGER DEFAULT 0,
    total_profit BIGINT DEFAULT 0,
    highest_profit BIGINT DEFAULT 0,
    transactions_today INTEGER DEFAULT 0,
    average_profit BIGINT DEFAULT 0,
    consecutive_profit_days INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    last_transaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id, achievement_id)
);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    profit_amount BIGINT;
BEGIN
    -- Calculate profit
    profit_amount := NEW.selling_price - NEW.original_price;

    -- Update user stats
    INSERT INTO user_stats (user_id, total_transactions, total_profit, highest_profit, transactions_today, last_transaction_date)
    VALUES (
        NEW.user_id,
        1,
        profit_amount,
        profit_amount,
        1,
        today_date
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_transactions = user_stats.total_transactions + 1,
        total_profit = user_stats.total_profit + profit_amount,
        highest_profit = GREATEST(user_stats.highest_profit, profit_amount),
        transactions_today = CASE 
            WHEN user_stats.last_transaction_date = today_date THEN user_stats.transactions_today + 1
            ELSE 1
        END,
        average_profit = (user_stats.total_profit + profit_amount) / (user_stats.total_transactions + 1),
        consecutive_profit_days = CASE 
            WHEN profit_amount > 0 AND (user_stats.last_transaction_date = today_date - INTERVAL '1 day' OR user_stats.last_transaction_date IS NULL)
            THEN user_stats.consecutive_profit_days + 1
            WHEN profit_amount > 0 THEN 1
            ELSE 0
        END,
        last_transaction_date = today_date,
        experience = user_stats.experience + GREATEST(1, profit_amount / 100000), -- Tăng exp dựa trên lợi nhuận
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transactions
CREATE TRIGGER update_stats_after_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Add RLS policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id); 