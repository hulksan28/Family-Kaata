const Category = require('../models/Category');

const defaultCategories = [
  // Income categories
  { name: 'Salary', type: 'income', emoji: '💰', isDefault: true },
  { name: 'Business', type: 'income', emoji: '🏪', isDefault: true },
  { name: 'Freelance', type: 'income', emoji: '💻', isDefault: true },
  { name: 'Investments', type: 'income', emoji: '📈', isDefault: true },
  { name: 'Rent Income', type: 'income', emoji: '🏠', isDefault: true },
  { name: 'Interest', type: 'income', emoji: '🏦', isDefault: true },
  { name: 'Gifts Received', type: 'income', emoji: '🎁', isDefault: true },
  { name: 'Other Income', type: 'income', emoji: '📋', isDefault: true },

  // Expense categories
  { name: 'Groceries / Kirana', type: 'expense', emoji: '🛒', isDefault: true },
  { name: 'Vegetables & Fruits', type: 'expense', emoji: '🥬', isDefault: true },
  { name: 'Milk & Dairy', type: 'expense', emoji: '🥛', isDefault: true },
  { name: 'Rent', type: 'expense', emoji: '🏠', isDefault: true },
  { name: 'Electricity', type: 'expense', emoji: '⚡', isDefault: true },
  { name: 'Water', type: 'expense', emoji: '💧', isDefault: true },
  { name: 'Gas / LPG', type: 'expense', emoji: '🔥', isDefault: true },
  { name: 'Mobile Recharge', type: 'expense', emoji: '📱', isDefault: true },
  { name: 'Internet / WiFi', type: 'expense', emoji: '📶', isDefault: true },
  { name: 'Transportation', type: 'expense', emoji: '🚌', isDefault: true },
  { name: 'Petrol / Diesel', type: 'expense', emoji: '⛽', isDefault: true },
  { name: 'Medical / Health', type: 'expense', emoji: '🏥', isDefault: true },
  { name: 'Education', type: 'expense', emoji: '📚', isDefault: true },
  { name: 'Clothing', type: 'expense', emoji: '👕', isDefault: true },
  { name: 'Entertainment', type: 'expense', emoji: '🎬', isDefault: true },
  { name: 'Dining Out', type: 'expense', emoji: '🍽️', isDefault: true },
  { name: 'Household Items', type: 'expense', emoji: '🏡', isDefault: true },
  { name: 'Personal Care', type: 'expense', emoji: '💇', isDefault: true },
  { name: 'Insurance', type: 'expense', emoji: '🛡️', isDefault: true },
  { name: 'EMI / Loans', type: 'expense', emoji: '💳', isDefault: true },
  { name: 'Donations / Pooja', type: 'expense', emoji: '🪔', isDefault: true },
  { name: 'Festivals', type: 'expense', emoji: '🎉', isDefault: true },
  { name: 'Gifts Given', type: 'expense', emoji: '🎁', isDefault: true },
  { name: 'Maintenance', type: 'expense', emoji: '🔧', isDefault: true },
  { name: 'Other Expense', type: 'expense', emoji: '📋', isDefault: true },
];

async function seedCategories() {
  try {
    const count = await Category.countDocuments({ isDefault: true });
    if (count === 0) {
      await Category.insertMany(defaultCategories);
      console.log('✅ Default categories seeded successfully');
    } else {
      console.log('ℹ️  Default categories already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
  }
}

module.exports = seedCategories;
