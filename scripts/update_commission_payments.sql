-- Adicionar tabela para controle de pagamentos de comissões
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- formato YYYY-MM
  total_amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_commission_payments_barber_month ON commission_payments(barber_id, month_year);
CREATE INDEX IF NOT EXISTS idx_commission_payments_receipt ON commission_payments(receipt_number);

-- Adicionar campo para controlar se a comissão foi paga
ALTER TABLE barber_commissions 
ADD COLUMN IF NOT EXISTS is_paid_for_month VARCHAR(7) DEFAULT NULL;

-- Criar view para facilitar consultas de comissões pendentes
CREATE OR REPLACE VIEW pending_commissions AS
SELECT 
  b.id as barber_id,
  b.profile_id,
  p.full_name as barber_name,
  DATE_TRUNC('month', NOW()) as current_month,
  COALESCE(SUM(bc.commission_percentage * s.price / 100), 0) as total_commission
FROM barbers b
JOIN profiles p ON b.profile_id = p.id
LEFT JOIN barber_commissions bc ON b.id = bc.barber_id
LEFT JOIN services s ON bc.service_id = s.id
WHERE b.is_active = true
GROUP BY b.id, b.profile_id, p.full_name;
