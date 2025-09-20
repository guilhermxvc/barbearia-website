-- Criar tabela para contas a pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  category TEXT NOT NULL CHECK (category IN ('commission', 'rent', 'utilities', 'supplies', 'other')),
  barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela para detalhes de comissões a pagar
CREATE TABLE IF NOT EXISTS commission_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_payable_id UUID REFERENCES accounts_payable(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir dados de exemplo para contas a pagar
INSERT INTO accounts_payable (description, amount, due_date, status, category, barber_id) VALUES
('Comissão João Silva - Janeiro 2024', 450.00, '2024-02-05', 'pending', 'commission', (SELECT id FROM barbers LIMIT 1)),
('Aluguel - Janeiro 2024', 2500.00, '2024-02-01', 'pending', 'rent', NULL),
('Energia Elétrica - Janeiro 2024', 380.00, '2024-02-10', 'pending', 'utilities', NULL),
('Produtos de Limpeza', 150.00, '2024-02-15', 'pending', 'supplies', NULL);

-- Inserir detalhes de comissão de exemplo
INSERT INTO commission_details (account_payable_id, service_name, service_price, commission_percentage, commission_amount, sale_date) VALUES
((SELECT id FROM accounts_payable WHERE description LIKE 'Comissão João Silva%' LIMIT 1), 'Corte Masculino', 25.00, 50.00, 12.50, '2024-01-15'),
((SELECT id FROM accounts_payable WHERE description LIKE 'Comissão João Silva%' LIMIT 1), 'Barba', 15.00, 50.00, 7.50, '2024-01-16'),
((SELECT id FROM accounts_payable WHERE description LIKE 'Comissão João Silva%' LIMIT 1), 'Corte + Barba', 35.00, 50.00, 17.50, '2024-01-18');
