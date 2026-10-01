"""
Demand data pipeline: fetch → feature-engineer → split.
"""
import numpy as np
import pandas as pd
from datetime import timedelta

from apps.forecasting.models import DemandHistoryDaily


def build_demand_dataframe(product_id: int, warehouse_id: int, lookback_days: int = 365):
    """Fetch demand history for a single (product, warehouse) and fill missing dates."""
    end = DemandHistoryDaily.objects.filter(
        product_id=product_id, warehouse_id=warehouse_id
    ).order_by('-demand_date').values_list('demand_date', flat=True).first()

    if not end:
        return pd.DataFrame()

    start = end - timedelta(days=lookback_days)

    rows = DemandHistoryDaily.objects.filter(
        product_id=product_id, warehouse_id=warehouse_id,
        demand_date__gte=start, demand_date__lte=end,
    ).values('demand_date', 'net_demand', 'units_sold', 'revenue').order_by('demand_date')

    df = pd.DataFrame(list(rows))
    if df.empty:
        return df

    df['demand_date'] = pd.to_datetime(df['demand_date'])
    df = df.set_index('demand_date').sort_index()

    full_idx = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
    df = df.reindex(full_idx).fillna(0)
    df.index.name = 'demand_date'
    df = df.reset_index()
    df['net_demand'] = df['net_demand'].astype(float)
    return df


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Lag + rolling + calendar features."""
    df = df.copy().sort_values('demand_date').reset_index(drop=True)

    df['day_of_week'] = df['demand_date'].dt.dayofweek
    df['day_of_month'] = df['demand_date'].dt.day
    df['month'] = df['demand_date'].dt.month
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

    for lag in (1, 7, 14, 28):
        df[f'lag_{lag}'] = df['net_demand'].shift(lag)

    for window in (7, 14, 30):
        df[f'rolling_mean_{window}'] = df['net_demand'].shift(1).rolling(window, min_periods=1).mean()
        df[f'rolling_std_{window}'] = df['net_demand'].shift(1).rolling(window, min_periods=1).std().fillna(0)

    df['trend'] = np.arange(len(df))
    return df


def chronological_split(df: pd.DataFrame, test_days: int = 30):
    df = df.dropna().reset_index(drop=True)
    if len(df) <= test_days:
        raise ValueError(f'Not enough rows ({len(df)}) to split (test_days={test_days}).')
    train = df.iloc[:-test_days].reset_index(drop=True)
    test = df.iloc[-test_days:].reset_index(drop=True)
    return train, test