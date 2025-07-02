import json
import random
from datetime import datetime

updated_products = []

with open("listings_f.json", "r", encoding="utf-8") as infile:
    for line in infile:
        line = line.strip()
        if not line:
            continue
        try:
            product = json.loads(line)

            # generate random fields
            quantity = random.randint(1, 100)
            price = round(random.uniform(10.0, 500.0), 2)
            rating = round(random.uniform(1.0, 5.0), 1)
            review = random.choice([
                "Excellent quality product!",
                "Pretty good value for money.",
                "Not bad, does the job.",
                "Could be better, average experience.",
                "Loved it, would buy again!"
            ])
            date_updated = datetime.now().isoformat()

            # add fields
            product["sku"] = product.get("item_id", "UNKNOWN")
            product["quantity"] = quantity
            product["price"] = price
            product["rating"] = rating
            product["review"] = review
            product["date_updated"] = date_updated

            updated_products.append(product)

        except json.JSONDecodeError as e:
            print(f"⚠️ Skipping line due to JSON error: {e}")

# write back to a new file
with open("listings_updatedf.json", "w", encoding="utf-8") as outfile:
    for product in updated_products:
        outfile.write(json.dumps(product) + "\n")

print("✅ All products updated and saved to listings_updated.json (no full_product field)")
