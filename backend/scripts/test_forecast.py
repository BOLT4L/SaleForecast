import json
import sys
from forecast import main

# Sample sales data
sample_data = [
    {"date": "2024-01-01", "totalAmount": 1000, "promotion": False},
    {"date": "2024-01-02", "totalAmount": 1200, "promotion": True},
    {"date": "2024-01-03", "totalAmount": 1100, "promotion": False},
    {"date": "2024-01-04", "totalAmount": 1300, "promotion": True},
    {"date": "2024-01-05", "totalAmount": 1250, "promotion": False},
    {"date": "2024-01-06", "totalAmount": 1400, "promotion": True},
    {"date": "2024-01-07", "totalAmount": 1350, "promotion": False},
    {"date": "2024-01-08", "totalAmount": 1500, "promotion": True},
    {"date": "2024-01-09", "totalAmount": 1450, "promotion": False},
    {"date": "2024-01-10", "totalAmount": 1600, "promotion": True}
]

# Set up sys.argv for the main function
sys.argv = [
    "forecast.py",
    json.dumps(sample_data),
    "Daily",
    "RandomForest",
    "2024-01-11",
    "2024-01-15"
]

if __name__ == "__main__":
    print("Starting test with sample data...")
    try:
        main()
    except Exception as e:
        print(f"Error occurred: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc() 