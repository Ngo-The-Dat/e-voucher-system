-- PostgreSQL Script to Drop All Tables in Voucher System
-- Using CASCADE allows dropping tables even when they contain data or foreign key dependencies

DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS popups CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS order_cancellations CASCADE;
DROP TABLE IF EXISTS reviews_feedback CASCADE;
DROP TABLE IF EXISTS issued_vouchers CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS voucher_approval_requests CASCADE;
DROP TABLE IF EXISTS voucher_program_images CASCADE;
DROP TABLE IF EXISTS voucher_program_branches CASCADE;
DROP TABLE IF EXISTS voucher_programs CASCADE;
DROP TABLE IF EXISTS partner_employees CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
