from app.models import MenuItem
from app.extensions import db

menu_items_data = [
    {"restaurant_id": 2, "category": "Starters", "name": "Bruschetta", "description": "Toasted bread with tomatoes and basil", "price": 8.99},
    {"restaurant_id": 2, "category": "Main Course", "name": "Spaghetti Carbonara", "description": "Pasta with eggs, cheese, and pancetta", "price": 14.99},
    {"restaurant_id": 2, "category": "Main Course", "name": "Margherita Pizza", "description": "Pizza with tomato, mozzarella, and basil", "price": 12.99},
    {"restaurant_id": 2, "category": "Desserts", "name": "Tiramisu", "description": "Coffee-flavored Italian dessert", "price": 6.99},
    {"restaurant_id": 3, "category": "Starters", "name": "Spring Rolls", "description": "Crispy rolls with vegetable filling", "price": 4.99},
    {"restaurant_id": 3, "category": "Main Course", "name": "Kung Pao Chicken", "description": "Spicy stir-fried chicken with peanuts", "price": 13.99},
    {"restaurant_id": 3, "category": "Main Course", "name": "Fried Rice", "description": "Stir-fried rice with vegetables and soy sauce", "price": 9.99},
    {"restaurant_id": 3, "category": "Desserts", "name": "Mango Pudding", "description": "Sweet mango-flavored pudding", "price": 5.99},
    {"restaurant_id": 4, "category": "Starters", "name": "Nachos", "description": "Tortilla chips with cheese and salsa", "price": 7.99},
    {"restaurant_id": 4, "category": "Main Course", "name": "Tacos", "description": "Soft or hard shell with choice of filling", "price": 10.99},
    {"restaurant_id": 4, "category": "Main Course", "name": "Enchiladas", "description": "Rolled tortillas with meat and sauce", "price": 12.99},
    {"restaurant_id": 4, "category": "Desserts", "name": "Churros", "description": "Fried dough pastry with cinnamon sugar", "price": 5.99},
    {"restaurant_id": 5, "category": "Starters", "name": "Samosas", "description": "Crispy pastries with spiced potato filling", "price": 4.99},
    {"restaurant_id": 5, "category": "Main Course", "name": "Butter Chicken", "description": "Chicken in a creamy tomato sauce", "price": 14.99},
    {"restaurant_id": 5, "category": "Main Course", "name": "Vegetable Biryani", "description": "Spiced rice with mixed vegetables", "price": 12.99},
    {"restaurant_id": 5, "category": "Desserts", "name": "Gulab Jamun", "description": "Sweet dumplings in syrup", "price": 3.99},
    {"restaurant_id": 6, "category": "Starters", "name": "Edamame", "description": "Steamed soybeans with salt", "price": 3.99},
    {"restaurant_id": 6, "category": "Main Course", "name": "Sushi Platter", "description": "Assortment of nigiri and maki", "price": 18.99},
    {"restaurant_id": 6, "category": "Main Course", "name": "Ramen", "description": "Noodle soup with pork and vegetables", "price": 12.99},
    {"restaurant_id": 6, "category": "Desserts", "name": "Mochi", "description": "Rice cake with sweet filling", "price": 4.99},
    {"restaurant_id": 7, "category": "Starters", "name": "Caprese Salad", "description": "Tomatoes, mozzarella, and basil", "price": 9.99},
    {"restaurant_id": 7, "category": "Main Course", "name": "Lasagna", "description": "Layered pasta with meat and cheese", "price": 15.99},
    {"restaurant_id": 7, "category": "Main Course", "name": "Fettuccine Alfredo", "description": "Pasta with creamy parmesan sauce", "price": 13.99},
    {"restaurant_id": 7, "category": "Desserts", "name": "Panna Cotta", "description": "Creamy Italian dessert", "price": 5.99},
    {"restaurant_id": 8, "category": "Starters", "name": "Dumplings", "description": "Steamed or fried dumplings", "price": 6.99},
    {"restaurant_id": 8, "category": "Main Course", "name": "Peking Duck", "description": "Roasted duck with pancakes", "price": 25.99},
    {"restaurant_id": 8, "category": "Main Course", "name": "Mapo Tofu", "description": "Spicy tofu with minced meat", "price": 11.99},
    {"restaurant_id": 8, "category": "Desserts", "name": "Egg Tart", "description": "Pastry with egg custard", "price": 3.99},
    {"restaurant_id": 9, "category": "Starters", "name": "Quesadilla", "description": "Tortilla with cheese and fillings", "price": 8.99},
    {"restaurant_id": 9, "category": "Main Course", "name": "Burrito", "description": "Wrapped tortilla with rice, beans, and meat", "price": 11.99},
    {"restaurant_id": 9, "category": "Main Course", "name": "Fajitas", "description": "Grilled meat with peppers and onions", "price": 14.99},
    {"restaurant_id": 9, "category": "Desserts", "name": "Flan", "description": "Caramel custard dessert", "price": 4.99},
    {"restaurant_id": 10, "category": "Starters", "name": "Pakoras", "description": "Fried vegetable fritters", "price": 5.99},
    {"restaurant_id": 10, "category": "Main Course", "name": "Tandoori Chicken", "description": "Chicken marinated in yogurt and spices", "price": 13.99},
    {"restaurant_id": 10, "category": "Main Course", "name": "Palak Paneer", "description": "Spinach curry with cottage cheese", "price": 12.99},
    {"restaurant_id": 10, "category": "Desserts", "name": "Kheer", "description": "Rice pudding with nuts and raisins", "price": 4.99},
    {"restaurant_id": 11, "category": "Starters", "name": "Wonton Soup", "description": "Soup with dumplings", "price": 6.99},
    {"restaurant_id": 11, "category": "Main Course", "name": "Chow Mein", "description": "Stir-fried noodles with vegetables", "price": 10.99},
    {"restaurant_id": 11, "category": "Main Course", "name": "Sweet and Sour Pork", "description": "Pork with pineapple and bell peppers", "price": 12.99},
    {"restaurant_id": 11, "category": "Desserts", "name": "Fortune Cookies", "description": "Crispy cookies with a message", "price": 2.99},
]

def seed_menu_items():
    for item in menu_items_data:
        menu_item = MenuItem(
            restaurant_id=item["restaurant_id"],
            category=item["category"],
            name=item["name"],
            description=item["description"],
            price=item["price"]
        )
        db.session.add(menu_item)
    db.session.commit()
    print("Menu items seeded successfully!")

# Run in Flask shell: from seed import seed_menu_items; seed_menu_items()