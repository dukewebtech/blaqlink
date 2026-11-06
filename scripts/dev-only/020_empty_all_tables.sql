-- Empty all tables and start fresh
-- This script deletes all data but keeps table structures and RLS policies intact

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = 'replica';

-- Delete data in the correct order (respecting foreign key constraints)
-- Start with dependent tables first, then parent tables

-- 1. Delete cart items (depends on carts and products)
DELETE FROM cart_items;

-- 2. Delete carts (depends on users)
DELETE FROM carts;

-- 3. Delete order items (depends on orders and products)
DELETE FROM order_items;

-- 4. Delete orders (depends on users)
DELETE FROM orders;

-- 5. Delete products (depends on users and categories)
DELETE FROM products;

-- 6. Delete categories (depends on users)
DELETE FROM categories;

-- 7. Delete user profiles (depends on auth.users)
DELETE FROM users;

-- Re-enable triggers
SET session_replication_role = 'default';

-- Verify all tables are empty
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM users;
    RAISE NOTICE 'Users table: % rows', table_count;
    
    SELECT COUNT(*) INTO table_count FROM products;
    RAISE NOTICE 'Products table: % rows', table_count;
    
    SELECT COUNT(*) INTO table_count FROM categories;
    RAISE NOTICE 'Categories table: % rows', table_count;
    
    SELECT COUNT(*) INTO table_count FROM orders;
    RAISE NOTICE 'Orders table: % rows', table_count;
    
    SELECT COUNT(*) INTO table_count FROM carts;
    RAISE NOTICE 'Carts table: % rows', table_count;
    
    RAISE NOTICE 'Database has been emptied successfully!';
END $$;
