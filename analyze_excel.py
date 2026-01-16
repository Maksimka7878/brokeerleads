import pandas as pd
import os

file_path = '/Users/a1111/Documents/trae_projects/for_leads/a_vroters_members (1).xlsx'

try:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
    else:
        df = pd.read_excel(file_path)
        print("Columns:")
        print(df.columns.tolist())
        print("\nFirst 3 rows:")
        print(df.head(3).to_string())
        print("\nData Types:")
        print(df.dtypes)
except Exception as e:
    print(f"Error reading file: {e}")
