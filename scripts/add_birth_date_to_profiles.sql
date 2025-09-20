-- Adicionar campo birth_date à tabela profiles para aniversários
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Adicionar alguns dados de exemplo para demonstração
UPDATE profiles 
SET birth_date = CASE 
  WHEN email LIKE '%@example.com' THEN CURRENT_DATE
  WHEN email LIKE '%@test.com' THEN CURRENT_DATE + INTERVAL '2 days'
  WHEN email LIKE '%@demo.com' THEN CURRENT_DATE + INTERVAL '5 days'
  ELSE NULL
END
WHERE role = 'client' AND birth_date IS NULL;
