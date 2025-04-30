import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from .config import engine
from .models import SalesData

def import_sales_data():
    # Read the CSV file
    df = pd.read_csv('database/sales_data.csv')
    
    # Convert date string to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Create a session
    with Session(engine) as session:
        # Clear existing data
        session.query(SalesData).delete()
        
        # Import new data
        for _, row in df.iterrows():
            sales_data = SalesData(
                city=row['city'],
                province=row['province'],
                date=row['date'],
                sales=row['sales'],
                flu_cases=row['flu_cases'],
                population=row['population'],
                land_area=row['land_area']
            )
            session.add(sales_data)
        
        # Commit the changes
        session.commit()

if __name__ == "__main__":
    print("Importing sales data...")
    import_sales_data()
    print("Sales data imported successfully!") 