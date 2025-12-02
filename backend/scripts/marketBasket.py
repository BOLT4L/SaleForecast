import sys
import json
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

def main():
    try:
        sales_data = json.loads(sys.argv[1])
        min_support = float(sys.argv[2]) if len(sys.argv) > 2 else 0.01
        min_confidence = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5

        if not sales_data:
            print(json.dumps({"error": "No sales data provided"}))
            sys.exit(1)

        transactions = []
        for sale in sales_data:
            if not isinstance(sale, dict) or 'items' not in sale or not sale['items']:
                continue
            items = [str(item['productId']) for item in sale['items'] if isinstance(item, dict) and item.get('productId')]
            if items:
                transactions.append(items)

        if not transactions:
            print(json.dumps({"error": "No valid transactions found"}))
            sys.exit(1)

        df = pd.DataFrame(transactions)
        if df.empty:
            print(json.dumps({"error": "Transaction DataFrame is empty"}))
            sys.exit(1)

        one_hot = pd.get_dummies(df.stack(), prefix='', prefix_sep='').groupby(level=0).sum()
        one_hot = one_hot >= 1

        frequent_itemsets = apriori(one_hot, min_support=min_support, use_colnames=True)
        rules = association_rules(frequent_itemsets, metric='confidence', min_threshold=min_confidence)

        itemsets = [
            {'items': list(row['itemsets']), 'support': float(row['support'])}
            for _, row in frequent_itemsets.iterrows()
        ]

        rules_list = [
            {
                'antecedents': list(row['antecedents']),
                'consequents': list(row['consequents']),
                'confidence': float(row['confidence']),
                'lift': float(row['lift']),
            }
            for _, row in rules.iterrows()
        ]

        result = {'itemsets': itemsets, 'rules': rules_list}
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Market Basket error: {str(e)}"}))
        sys.exit(1)

if __name__ == '__main__':
    main()