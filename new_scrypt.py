import json
import random
import string
import os
from datetime import datetime, timedelta
from faker import Faker
from cryptography.fernet import Fernet

# Configuration
ABOD_JSONL_PATH = "FR.jsonl"
OUTPUT_PATH = "nested_customersFR.json"
KEY_FILE = "fernet.key"
NUM_CUSTOMERS = 10000
MAX_PRODUCTS_FROM_ABOD = 5000
MIN_BASKETS = 1                                                                                     
MAX_BASKETS = 50
MIN_PRODUCTS = 1
MAX_PRODUCTS = 10

# Fernet encryption setup
if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        FERNET_KEY = f.read()
else:
    FERNET_KEY = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(FERNET_KEY)

fernet = Fernet(FERNET_KEY)

# Faker setup
fake = Faker()
random.seed(42)
Faker.seed(42)

# Helper functions
def load_abod_products(jsonl_path, max_products=None):
    products = []
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if "item_id" in data and "item_name" in data:
                    products.append(data)
                    if max_products and len(products) >= max_products:
                        break
            except json.JSONDecodeError:
                continue
    return products

def generate_username(name, email):
    base = name.split()[0].lower() + str(random.randint(100, 999))
    domain_part = email.split('@')[0]
    return f"{base}_{domain_part}"

def generate_password(length=12):
    chars = string.ascii_letters + string.digits + "!@#$%^&*()"
    return ''.join(random.choice(chars) for _ in range(length))

def encrypt_password(password):
    return fernet.encrypt(password.encode()).decode()

def decrypt_password(encrypted):
    return fernet.decrypt(encrypted.encode()).decode()

def generate_nested_customers(num_customers, abod_products):
    customer_tiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
    languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Hindi']
    nested_customers = []
    basket_id_counter = 1

    for cid in range(num_customers):
        name = fake.name()
        email = fake.email()
        username = generate_username(name, email)
        password = generate_password()
        encrypted_password = encrypt_password(password)

        creation_date = fake.date_between(start_date='-5y', end_date='-1y')
        last_login = fake.date_between(start_date=creation_date, end_date='today')
        birthday = fake.date_of_birth(minimum_age=18, maximum_age=80)

        credit_card_raw = fake.credit_card_full()
        lines = credit_card_raw.split('\n')
        card_type = lines[0].strip() if len(lines) > 0 else ""
        cardholder_name = lines[1].strip() if len(lines) > 1 else ""
        number_and_exp = lines[2].strip() if len(lines) > 2 else ""
        cvc_line = lines[3].strip() if len(lines) > 3 else ""
        card_number, expiration = number_and_exp.rsplit(' ', 1) if ' ' in number_and_exp else ("", "")
        cvc = cvc_line.replace("CVC:", "").strip() if "CVC:" in cvc_line else ""

        customer = {
    "id": cid,
    "customer_name": name,
    "email": email,
    "username": username,
    "encrypted_password": encrypted_password,
    "phone_number": fake.phone_number(),
    "account_creation_date": creation_date.strftime("%Y-%m-%d"),
    "last_login": last_login.strftime("%Y-%m-%d"),
    "customer_tier": random.choice(customer_tiers),
    "birthday": birthday.strftime("%Y-%m-%d"),
    "country": "FR",  # <-- Added country field here
    "credit_card": {
        "card_type": encrypt_password(card_type),
        "cardholder_name": encrypt_password(cardholder_name),
        "card_number": encrypt_password(card_number),
        "expiration": encrypt_password(expiration),
        "cvc": encrypt_password(cvc)
    },
    "languages": random.sample(languages, k=random.randint(1, 2)),
    "wishlist": [],
    "address": fake.address(),
    "shipping_address": fake.address(),
    "billing_address": fake.address(),
    "baskets": []
}


        num_baskets = random.randint(MIN_BASKETS, MAX_BASKETS)
        for _ in range(num_baskets):
            basket_id = f"B{basket_id_counter:06}"
            basket_date = (datetime.today() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
            basket_status = random.choices(["CURRENT", "SAVED", "BOUGHT"], weights=[0.1, 0.4, 0.5])[0]
            is_bought = basket_status == "BOUGHT"
            checkout_timestamp = datetime.today().isoformat() if is_bought else None
            shipping_status = random.choice(["Delivered", "In Progress"]) if is_bought else None
            tracking_number = fake.uuid4() if is_bought else None

            sampled_products = random.sample(abod_products, random.randint(MIN_PRODUCTS, MAX_PRODUCTS))
            products = []
            total_price = 0
            for product in sampled_products:
                quantity = random.randint(1, 5)
                price = round(random.uniform(5, 200), 2)
                rating = round(random.uniform(1.0, 5.0), 1)
                review = fake.sentence()
                updated_date = fake.date_this_year().strftime("%Y-%m-%d")
                total_product_price = price * quantity
                total_price += total_product_price
                products.append({
                    "sku": product["item_id"],
                    "quantity": quantity,
                    "price": price,
                    "rating": rating,
                    "review": review,
                    "date_updated": updated_date,
                    "full_product": product
                })

            discount = round(total_price * random.uniform(0.05, 0.25), 2) if is_bought else 0.0
            final_price = round(total_price - discount, 2)

            basket = {
                "id": basket_id,
                "date": basket_date,
                "type": basket_status,
                "products": products,
                "total_price": round(total_price, 2),
                "discount_applied": discount,
                "final_price": final_price,
                "checkout_timestamp": checkout_timestamp,
                "shipping_status": shipping_status,
                "tracking_number": tracking_number
            }

            if basket_status == "SAVED":
                customer["wishlist"].append(basket)
            else:
                customer["baskets"].append(basket)

            basket_id_counter += 1

        nested_customers.append(customer)
    return nested_customers

def save_json(data, path):
    with open(path, "w", encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    print(" Script started")
    print("  Loading product data...")
    abod_products = load_abod_products(ABOD_JSONL_PATH, MAX_PRODUCTS_FROM_ABOD)
    print(f" Loaded {len(abod_products)} products.")
    if not abod_products:
        print(" No products loaded. Make sure listings.json is valid.")
        return
    print("  Generating customer data...")
    nested_customers = generate_nested_customers(NUM_CUSTOMERS, abod_products)
    print(f" Generated {len(nested_customers)} customers.")
    print(f" Saving to {OUTPUT_PATH}...")
    save_json(nested_customers, OUTPUT_PATH)
    print(" Done! File created.")

if __name__ == "__main__":
    main()
