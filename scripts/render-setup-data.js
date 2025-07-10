import { dbAsync } from '../dist/database/connection.js';
import { getCurrentTimestamp } from '../dist/database/setup.js';
import { generateUniqueQrValue } from '../dist/utils/qrCode.js';

// All sizes that should be in the system
const allSizes = [
  // Baby/Infant sizes
  "Preemie", "Newborn", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", 
  "12-18 Months", "18-24 Months", "24 Months",
  
  // Toddler sizes
  "2T", "3T", "4T", "5T",
  
  // Youth sizes
  "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
  
  // Adult clothing sizes
  "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL",
  
  // Underwear sizes
  "2-4", "5-6", "6-8", "7-8", "10-12", "14-16", "18",
  
  // Sock sizes
  "Infant", "6-18", "18-36", "3T-5T", "Adult",
  
  // Shoe sizes
  "Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10",
  "Little Kid 11", "Little Kid 12", "Little Kid 13",
  "Big Kid 1", "Big Kid 2", "Big Kid 3", "Big Kid 4", "Big Kid 5", "Big Kid 6",
  "Women 4", "Women 5", "Women 6", "Women 7", "Women 8", "Women 9", "Women 10", "Women 11",
  "Men 7", "Men 8", "Men 9", "Men 10", "Men 11", "Men 12", "Men 13",
  
  // Diaper sizes
  "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Size 7",
  
  // Pull-up sizes
  "2T-3T", "3T-4T", "4T-5T", "5T-6T",
  
  // Bedding sizes
  "Crib", "Twin", "Full", "Queen", "King",
  
  // General sizes
  "Small", "Medium", "Large", "One Size",
  
  // Special sizes
  "Baby", "Child", "Youth", "Adult", "Training", "Sports", "Camis",
  
  // Women's specific
  "Women XS", "Women S", "Women M", "Women L", "Women XL"
];

// All Rainbow Room categories with their details
const categories = [
  // Boys Clothing Categories
  { name: "Boys Pants", description: "Pants for boys from preemie to adult sizes", lowStockThreshold: 15 },
  { name: "Boys Shorts", description: "Shorts for boys from preemie to adult sizes", lowStockThreshold: 10 },
  { name: "Boys Long Sleeve Shirts", description: "Long sleeve shirts for boys", lowStockThreshold: 15 },
  { name: "Boys Short Sleeve Shirts", description: "Short sleeve shirts for boys", lowStockThreshold: 15 },
  { name: "Boys Summer/Winter Outfits", description: "Complete outfits for boys", lowStockThreshold: 10 },
  { name: "Boys Pajamas", description: "Pajamas and sleepwear for boys", lowStockThreshold: 10 },
  { name: "Boys Light Jackets", description: "Light jackets and sweaters for boys", lowStockThreshold: 8 },
  { name: "Boys Winter Jackets", description: "Heavy winter coats for boys", lowStockThreshold: 5 },
  { name: "Boys Underwear", description: "Underwear for boys", lowStockThreshold: 20 },
  { name: "Boys Socks", description: "Socks for boys", lowStockThreshold: 25 },
  { name: "Boys Undershirts", description: "Undershirts for boys", lowStockThreshold: 15 },
  { name: "Boys Shoes", description: "Footwear for boys", lowStockThreshold: 10 },
  { name: "Boys Hats", description: "Hats and caps for boys", lowStockThreshold: 8 },
  { name: "Boys Gloves", description: "Gloves and mittens for boys", lowStockThreshold: 8 },
  { name: "Boys Onesies", description: "Onesies for baby boys", lowStockThreshold: 15 },

  // Girls Clothing Categories
  { name: "Girls Pants", description: "Pants for girls from preemie to adult sizes", lowStockThreshold: 15 },
  { name: "Girls Shorts", description: "Shorts for girls from preemie to adult sizes", lowStockThreshold: 10 },
  { name: "Girls Long Sleeve Shirts", description: "Long sleeve shirts for girls", lowStockThreshold: 15 },
  { name: "Girls Short Sleeve Shirts", description: "Short sleeve shirts for girls", lowStockThreshold: 15 },
  { name: "Girls Summer/Winter Outfits", description: "Complete outfits for girls", lowStockThreshold: 10 },
  { name: "Girls Pajamas", description: "Pajamas and sleepwear for girls", lowStockThreshold: 10 },
  { name: "Girls Light Jackets", description: "Light jackets and sweaters for girls", lowStockThreshold: 8 },
  { name: "Girls Winter Jackets", description: "Heavy winter coats for girls", lowStockThreshold: 5 },
  { name: "Girls Underwear", description: "Underwear for girls", lowStockThreshold: 20 },
  { name: "Girls Socks", description: "Socks for girls", lowStockThreshold: 25 },
  { name: "Girls Bras", description: "Training bras and sports bras for girls", lowStockThreshold: 10 },
  { name: "Girls Shoes", description: "Footwear for girls", lowStockThreshold: 10 },
  { name: "Girls Hats", description: "Hats and accessories for girls", lowStockThreshold: 8 },
  { name: "Girls Gloves", description: "Gloves and mittens for girls", lowStockThreshold: 8 },
  { name: "Girls Onesies", description: "Onesies for baby girls", lowStockThreshold: 15 },

  // Diapers and Pull-ups
  { name: "Diapers", description: "Disposable diapers all sizes (Preemie to Size 7)", lowStockThreshold: 30 },
  { name: "Pull-ups", description: "Training pants and pull-ups (2T-6T)", lowStockThreshold: 20 },

  // Toiletries and Hygiene
  { name: "Shampoo", description: "Shampoo for all ages", lowStockThreshold: 15 },
  { name: "Conditioner", description: "Hair conditioner", lowStockThreshold: 10 },
  { name: "Body Wash", description: "Body wash for men, women, and children", lowStockThreshold: 15 },
  { name: "Deodorant", description: "Deodorant for men and women", lowStockThreshold: 20 },
  { name: "Razors", description: "Disposable razors for men and women", lowStockThreshold: 15 },
  { name: "Soap Bars", description: "Bar soap", lowStockThreshold: 20 },
  { name: "Shaving Cream", description: "Shaving cream and gel", lowStockThreshold: 10 },
  { name: "Cosmetics", description: "Makeup and beauty products", lowStockThreshold: 10 },
  { name: "Pads", description: "Feminine hygiene pads all sizes", lowStockThreshold: 25 },
  { name: "Tampons", description: "Tampons regular and super", lowStockThreshold: 25 },
  { name: "Feminine Hygiene Wipes", description: "Feminine hygiene wipes", lowStockThreshold: 15 },
  { name: "Toothbrushes", description: "Toothbrushes for all ages", lowStockThreshold: 30 },
  { name: "Toothpaste", description: "Toothpaste", lowStockThreshold: 20 },
  { name: "Hair Brushes", description: "Hair brushes and combs", lowStockThreshold: 15 },
  { name: "Lice Treatment", description: "Lice shampoo, spray, and kits", lowStockThreshold: 8 },
  { name: "Lotion", description: "Body lotion and moisturizers", lowStockThreshold: 15 },
  { name: "Cotton Swabs", description: "Q-tips and cotton swabs", lowStockThreshold: 15 },
  { name: "Hair Tools", description: "Hair styling tools and accessories", lowStockThreshold: 10 },
  { name: "African American Hair Products", description: "Specialized hair products including curl cream and hair masks", lowStockThreshold: 12 },
  { name: "Face Wash", description: "Facial cleansers", lowStockThreshold: 10 },
  { name: "Nail Care", description: "Nail clippers, files, and care items", lowStockThreshold: 10 },
  { name: "First Aid", description: "Basic first aid supplies", lowStockThreshold: 10 },

  // Infant Supplies
  { name: "Baby Shampoo & Wash", description: "Baby shampoo, wash, and 2-in-1 products", lowStockThreshold: 15 },
  { name: "Baby Care Products", description: "Baby oil, powder, lotion, and diaper rash cream", lowStockThreshold: 20 },
  { name: "Baby Feeding Supplies", description: "Sippy cups, bottles, nipples, and formula", lowStockThreshold: 20 },
  { name: "Baby Comfort Items", description: "Pacifiers, teethers, swaddles, and baby blankets", lowStockThreshold: 15 },
  { name: "Baby Wipes", description: "Baby wipes and diaper changing supplies", lowStockThreshold: 25 },

  // School Supplies
  { name: "School Backpacks", description: "Backpacks for school", lowStockThreshold: 10 },
  { name: "School Health Supplies", description: "Hand sanitizer and tissues", lowStockThreshold: 20 },
  { name: "School Paper Supplies", description: "Notebooks, paper, and writing materials", lowStockThreshold: 25 },
  { name: "School Writing Tools", description: "Pencils, pens, markers, and art supplies", lowStockThreshold: 30 },
  { name: "Personal Accessories", description: "Purses, wallets, and personal items", lowStockThreshold: 8 },

  // Household Supplies
  { name: "Cleaning Supplies", description: "Brooms, mops, brushes, and cleaning agents", lowStockThreshold: 10 },
  { name: "Bedding", description: "Comforters, sheets, and pillows", lowStockThreshold: 8 },
  { name: "Towels & Washcloths", description: "Bath towels and washcloths", lowStockThreshold: 15 },
  { name: "Paper Products", description: "Paper towels and toilet paper", lowStockThreshold: 20 },

  // Emergency Needs
  { name: "Car Seats", description: "Baby car seats, convertible seats, and booster seats", lowStockThreshold: 3 },
  { name: "Pack and Play", description: "Portable cribs and play yards", lowStockThreshold: 2 },

  // Toys and Activities
  { name: "Toys", description: "General toys for all ages", lowStockThreshold: 15 },
  { name: "Puzzles & Board Games", description: "Educational and entertainment games", lowStockThreshold: 10 },
  { name: "Electronics", description: "Electronic toys and devices", lowStockThreshold: 5 },
  { name: "Arts & Crafts", description: "Art supplies and craft materials", lowStockThreshold: 15 },
  { name: "Sports Equipment", description: "Sports toys and equipment", lowStockThreshold: 8 }
];

// Size associations based on the Rainbow Room inventory data
const categoryToSizes = {
  // Boys Clothing (all clothing items need clothing sizes)
  "Boys Pants": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Shorts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Long Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Short Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Summer/Winter Outfits": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Pajamas": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Light Jackets": [
    "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Winter Jackets": [
    "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Underwear": [
    "2-4", "5-6", "7-8", "10-12", "14-16", "18", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL"
  ],
  "Boys Socks": [
    "Infant", "6-18", "18-36", "3T-5T", "Youth S", "Youth M", "Youth L", "Adult"
  ],
  "Boys Undershirts": [
    "Youth", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Shoes": [
    "Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10",
    "Little Kid 11", "Little Kid 12", "Little Kid 13", "Big Kid 1", "Big Kid 2", "Big Kid 3", 
    "Big Kid 4", "Big Kid 5", "Big Kid 6", "Women 5", "Women 6", "Women 7", "Women 8", "Women 9", 
    "Women 10", "Women 11", "Men 7", "Men 8", "Men 9", "Men 10", "Men 11", "Men 12", "Men 13"
  ],
  "Boys Hats": ["Baby", "Youth", "Adult"],
  "Boys Gloves": ["Child", "Youth", "Adult"],
  "Boys Onesies": ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "24 Months"],

  // Girls Clothing (same as boys mostly)
  "Girls Pants": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Shorts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Long Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Short Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Summer/Winter Outfits": [
    "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Pajamas": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Light Jackets": [
    "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Winter Jackets": [
    "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Underwear": [
    "2-4", "6-8", "10-12", "14-16", "Women XS", "Women S", "Women M", "Women L", "Women XL"
  ],
  "Girls Socks": [
    "Infant", "6-18", "18-36", "3T-5T", "Youth S", "Youth M", "Youth L", "Adult"
  ],
  "Girls Bras": [
    "Training", "Sports", "Adult", "Camis"
  ],
  "Girls Shoes": [
    "Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10",
    "Little Kid 11", "Little Kid 12", "Little Kid 13", "Big Kid 1", "Big Kid 2", "Big Kid 3", 
    "Big Kid 4", "Big Kid 5", "Big Kid 6", "Women 4", "Women 5", "Women 6", "Women 7", "Women 8", 
    "Women 9", "Women 10", "Women 11"
  ],
  "Girls Hats": ["Baby", "Youth", "Adult"],
  "Girls Gloves": ["Child", "Youth", "Adult"],
  "Girls Onesies": ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "24 Months"],

  // Diapers and Pull-ups
  "Diapers": ["Preemie", "Newborn", "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Size 7"],
  "Pull-ups": ["2T-3T", "3T-4T", "4T-5T", "5T-6T"],

  // Books by reading level/age
  "Arts & Crafts": ["Small", "Medium", "Large"],
  "Toys": ["Small", "Medium", "Large"],
  "Sports Equipment": ["Small", "Medium", "Large"],

  // Bedding sizes
  "Bedding": ["Crib", "Twin", "Full", "Queen", "King"],
  
  // Baby and infant supplies (mostly one size)
  "Baby Wipes": ["One Size"],
  "Baby Shampoo & Wash": ["One Size"],
  "Baby Care Products": ["One Size"],
  "Baby Feeding Supplies": ["One Size"],
  "Baby Comfort Items": ["One Size"],
  
  // Toiletries and hygiene (mostly one size)
  "Shampoo": ["One Size"],
  "Conditioner": ["One Size"],
  "Body Wash": ["One Size"],
  "Deodorant": ["One Size"],
  "Razors": ["One Size"],
  "Soap Bars": ["One Size"],
  "Shaving Cream": ["One Size"],
  "Cosmetics": ["One Size"],
  "Pads": ["One Size"],
  "Tampons": ["One Size"],
  "Feminine Hygiene Wipes": ["One Size"],
  "Toothbrushes": ["One Size"],
  "Toothpaste": ["One Size"],
  "Hair Brushes": ["One Size"],
  "Lice Treatment": ["One Size"],
  "Lotion": ["One Size"],
  "Cotton Swabs": ["One Size"],
  "Hair Tools": ["One Size"],
  "African American Hair Products": ["One Size"],
  "Face Wash": ["One Size"],
  "Nail Care": ["One Size"],
  "First Aid": ["One Size"],
  
  // School supplies
  "School Backpacks": ["One Size"],
  "School Health Supplies": ["One Size"],
  "School Paper Supplies": ["One Size"],
  "School Writing Tools": ["One Size"],
  "Personal Accessories": ["One Size"],
  
  // Household supplies
  "Cleaning Supplies": ["One Size"],
  "Towels & Washcloths": ["One Size"],
  "Paper Products": ["One Size"],
  
  // Emergency needs
  "Car Seats": ["One Size"],
  "Pack and Play": ["One Size"],
  
  // Entertainment
  "Puzzles & Board Games": ["One Size"],
  "Electronics": ["One Size"]
};

// Sample items for demonstration
const sampleItems = [
  // Boys clothing samples
  { categoryName: "Boys Pants", sizeName: "2T", condition: "New", location: "McKinney", donorInfo: "Local family", approxPrice: 12.99 },
  { categoryName: "Boys Pants", sizeName: "4T", condition: "Gently Used", location: "Plano", donorInfo: "Community donation", approxPrice: 8.50 },
  { categoryName: "Boys Pants", sizeName: "Youth M", condition: "New", location: "McKinney", donorInfo: "Target donation", approxPrice: 15.99 },
  
  { categoryName: "Boys Short Sleeve Shirts", sizeName: "3T", condition: "New", location: "McKinney", donorInfo: "Walmart donation", approxPrice: 6.99 },
  { categoryName: "Boys Short Sleeve Shirts", sizeName: "Youth L", condition: "Gently Used", location: "Plano", donorInfo: "Parent donation", approxPrice: 4.50 },
  
  { categoryName: "Boys Shoes", sizeName: "Toddler 6", condition: "Gently Used", location: "McKinney", donorInfo: "Local family", approxPrice: 18.99 },
  { categoryName: "Boys Shoes", sizeName: "Big Kid 2", condition: "New", location: "Plano", donorInfo: "Nike donation", approxPrice: 45.00 },
  
  // Girls clothing samples
  { categoryName: "Girls Pants", sizeName: "18-24 Months", condition: "New", location: "McKinney", donorInfo: "Carter's donation", approxPrice: 14.99 },
  { categoryName: "Girls Pants", sizeName: "5T", condition: "Gently Used", location: "Plano", donorInfo: "Community drive", approxPrice: 7.50 },
  
  { categoryName: "Girls Long Sleeve Shirts", sizeName: "2T", condition: "New", location: "McKinney", donorInfo: "Local business", approxPrice: 9.99 },
  { categoryName: "Girls Long Sleeve Shirts", sizeName: "Youth S", condition: "Gently Used", location: "Plano", donorInfo: "Family donation", approxPrice: 5.99 },
  
  { categoryName: "Girls Shoes", sizeName: "Toddler 8", condition: "New", location: "McKinney", donorInfo: "Stride Rite donation", approxPrice: 32.99 },
  { categoryName: "Girls Shoes", sizeName: "Women 6", condition: "Gently Used", location: "Plano", donorInfo: "Teen donation", approxPrice: 22.50 },
  
  // Baby supplies
  { categoryName: "Diapers", sizeName: "Size 2", condition: "New", location: "McKinney", donorInfo: "Huggies donation", approxPrice: 24.99 },
  { categoryName: "Diapers", sizeName: "Size 4", condition: "New", location: "Plano", donorInfo: "Pampers donation", approxPrice: 26.99 },
  { categoryName: "Diapers", sizeName: "Newborn", condition: "New", location: "McKinney", donorInfo: "Hospital donation", approxPrice: 22.99 },
  
  { categoryName: "Baby Wipes", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Costco donation", approxPrice: 19.99 },
  { categoryName: "Baby Wipes", sizeName: "One Size", condition: "New", location: "Plano", donorInfo: "Sam's Club donation", approxPrice: 18.99 },
  
  { categoryName: "Baby Care Products", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Johnson & Johnson", approxPrice: 8.99 },
  
  // Toiletries
  { categoryName: "Shampoo", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "P&G donation", approxPrice: 4.99 },
  { categoryName: "Shampoo", sizeName: "One Size", condition: "New", location: "Plano", donorInfo: "Local pharmacy", approxPrice: 6.50 },
  
  { categoryName: "Toothbrushes", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Dentist office", approxPrice: 2.99 },
  { categoryName: "Toothbrushes", sizeName: "One Size", condition: "New", location: "Plano", donorInfo: "Oral-B donation", approxPrice: 3.50 },
  
  { categoryName: "Body Wash", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Dove donation", approxPrice: 5.99 },
  
  // School supplies
  { categoryName: "School Backpacks", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Back-to-school drive", approxPrice: 25.99 },
  { categoryName: "School Backpacks", sizeName: "One Size", condition: "Gently Used", location: "Plano", donorInfo: "Parent donation", approxPrice: 12.00 },
  
  { categoryName: "School Writing Tools", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Crayola donation", approxPrice: 8.99 },
  { categoryName: "School Paper Supplies", sizeName: "One Size", condition: "New", location: "Plano", donorInfo: "Office depot", approxPrice: 15.50 },
  
  // Toys and entertainment
  { categoryName: "Toys", sizeName: "Small", condition: "Gently Used", location: "McKinney", donorInfo: "Family donation", approxPrice: 12.99 },
  { categoryName: "Toys", sizeName: "Medium", condition: "New", location: "Plano", donorInfo: "Mattel donation", approxPrice: 19.99 },
  { categoryName: "Toys", sizeName: "Large", condition: "Gently Used", location: "McKinney", donorInfo: "Community drive", approxPrice: 35.00 },
  
  { categoryName: "Puzzles & Board Games", sizeName: "One Size", condition: "New", location: "Plano", donorInfo: "Hasbro donation", approxPrice: 14.99 },
  { categoryName: "Arts & Crafts", sizeName: "Medium", condition: "New", location: "McKinney", donorInfo: "Michaels donation", approxPrice: 22.50 },
  
  // Bedding
  { categoryName: "Bedding", sizeName: "Twin", condition: "New", location: "McKinney", donorInfo: "Target donation", approxPrice: 39.99 },
  { categoryName: "Bedding", sizeName: "Crib", condition: "Gently Used", location: "Plano", donorInfo: "Parent donation", approxPrice: 25.00 },
  
  // Emergency items
  { categoryName: "Car Seats", sizeName: "One Size", condition: "New", location: "McKinney", donorInfo: "Graco donation", approxPrice: 89.99 },
  { categoryName: "Pack and Play", sizeName: "One Size", condition: "Gently Used", location: "Plano", donorInfo: "Family donation", approxPrice: 65.00 }
];

async function setupRenderData() {
  try {
    console.log('🚀 Starting Render data setup...');
    const timestamp = getCurrentTimestamp();
    
    // Create all sizes first
    console.log('📏 Creating sizes...');
    const sizeMap = {};
    for (const sizeName of allSizes) {
      try {
        const result = await dbAsync.run(
          'INSERT INTO Size (name, createdAt, updatedAt) VALUES (?, ?, ?)',
          [sizeName, timestamp, timestamp]
        );
        sizeMap[sizeName] = result.lastID;
        console.log(`  ✅ Created size: ${sizeName}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          // Size already exists, get its ID
          const existing = await dbAsync.get('SELECT id FROM Size WHERE name = ?', [sizeName]);
          sizeMap[sizeName] = existing.id;
          console.log(`  ✓ Size already exists: ${sizeName}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create all categories with QR codes
    console.log('\n🏷️  Creating categories...');
    const categoryMap = {};
    for (const category of categories) {
      try {
        const qrCodeValue = await generateUniqueQrValue();
        const result = await dbAsync.run(
          'INSERT INTO ItemCategory (name, description, lowStockThreshold, qrCodeValue, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [category.name, category.description, category.lowStockThreshold, qrCodeValue, timestamp, timestamp]
        );
        categoryMap[category.name] = result.lastID;
        console.log(`  ✅ Created category: ${category.name}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          // Category already exists, get its ID
          const existing = await dbAsync.get('SELECT id FROM ItemCategory WHERE name = ?', [category.name]);
          categoryMap[category.name] = existing.id;
          console.log(`  ✓ Category already exists: ${category.name}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create size associations
    console.log('\n🔗 Creating size associations...');
    let associationCount = 0;
    for (const [categoryName, sizeNames] of Object.entries(categoryToSizes)) {
      const categoryId = categoryMap[categoryName];
      if (!categoryId) {
        console.log(`  ⚠️  Category "${categoryName}" not found, skipping...`);
        continue;
      }
      
      for (const sizeName of sizeNames) {
        const sizeId = sizeMap[sizeName];
        if (!sizeId) {
          console.log(`  ⚠️  Size "${sizeName}" not found, skipping...`);
          continue;
        }
        
        try {
          // Check if association already exists
          const existing = await dbAsync.get(
            'SELECT id FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
            [categoryId, sizeId]
          );
          
          if (!existing) {
            await dbAsync.run(
              'INSERT INTO ItemSize (itemCategoryId, sizeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
              [categoryId, sizeId, timestamp, timestamp]
            );
            associationCount++;
          }
        } catch (error) {
          console.log(`  ❌ Failed to associate "${categoryName}" with "${sizeName}": ${error.message}`);
        }
      }
      console.log(`  ✅ Associated sizes for: ${categoryName}`);
    }
    
    // Create sample items
    console.log('\n📦 Creating sample items...');
    let itemCount = 0;
    for (const item of sampleItems) {
      const categoryId = categoryMap[item.categoryName];
      const sizeId = sizeMap[item.sizeName];
      
      if (!categoryId || !sizeId) {
        console.log(`  ⚠️  Skipping item: missing category or size for ${item.categoryName} - ${item.sizeName}`);
        continue;
      }
      
      try {
        await dbAsync.run(
          `INSERT INTO ItemDetail (
            itemCategoryId, sizeId, condition, location, receivedDate, 
            donorInfo, approxPrice, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            categoryId,
            sizeId,
            item.condition,
            item.location,
            new Date().toISOString().split('T')[0], // today's date
            item.donorInfo,
            item.approxPrice,
            timestamp,
            timestamp
          ]
        );
        itemCount++;
        console.log(`  ✅ Created item: ${item.categoryName} (${item.sizeName}) - ${item.condition}`);
      } catch (error) {
        console.log(`  ❌ Failed to create item: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Render data setup complete!');
    console.log(`📊 Summary:`);
    console.log(`  • Sizes: ${Object.keys(sizeMap).length}`);
    console.log(`  • Categories: ${Object.keys(categoryMap).length}`);
    console.log(`  • Size associations: ${associationCount}`);
    console.log(`  • Sample items: ${itemCount}`);
    
  } catch (error) {
    console.error('❌ Error setting up Render data:', error);
    throw error;
  }
}

// Run the setup
setupRenderData()
  .then(() => {
    console.log('\n✅ Render data setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to setup Render data:', error);
    process.exit(1);
  });