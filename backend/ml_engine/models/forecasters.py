"""
Forecasting models. Each has fit(df) and predict(horizon).
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


FEATURE_EXCLUDE = {'demand_date', 'net_demand', 'units_sold', 'revenue'}


def _metrics(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mask = y_true > 0
    if mask.any():
        mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)
    else:
        mape = None
    return {
        'MAE': round(mae, 4),
        'RMSE': round(rmse, 4),
        'MAPE': round(mape, 4) if mape is not None else None,
    }


class BaseForecaster:
    name = 'base'
    version = '1.0'

    def fit(self, df: pd.DataFrame, target_col='net_demand'):
        raise NotImplementedError

    def predict(self, horizon: int):
        raise NotImplementedError


class MovingAverageForecaster(BaseForecaster):
    name = 'MovingAverage'
    version = '1.0'

    def __init__(self, window=7):
        self.window = window
        self._value = 0.0

    def fit(self, df, target_col='net_demand'):
        series = df[target_col].astype(float)
        self._value = float(series.tail(self.window).mean()) if len(series) else 0.0
        return self

    def predict(self, horizon):
        return np.full(horizon, max(self._value, 0.0))


class ExponentialSmoothingForecaster(BaseForecaster):
    name = 'ExponentialSmoothing'
    version = '1.0'

    def fit(self, df, target_col='net_demand'):
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        series = df[target_col].astype(float).values
        try:
            self._model = ExponentialSmoothing(
                series, trend='add', seasonal='add', seasonal_periods=7,
                initialization_method='estimated',
            ).fit(optimized=True)
        except Exception:
            self._model = ExponentialSmoothing(series, trend='add').fit(optimized=True)
        return self

    def predict(self, horizon):
        preds = self._model.forecast(horizon)
        return np.maximum(np.asarray(preds, dtype=float), 0.0)


class RandomForestForecaster(BaseForecaster):
    name = 'RandomForest'
    version = '1.0'

    def __init__(self, n_estimators=200, max_depth=12, random_state=42):
        self.model = RandomForestRegressor(
            n_estimators=n_estimators, max_depth=max_depth,
            random_state=random_state, n_jobs=-1,
        )
        self.feature_cols = None
        self._last_features = None

    def fit(self, df, target_col='net_demand'):
        self.feature_cols = [c for c in df.columns if c not in FEATURE_EXCLUDE]
        X = df[self.feature_cols].values
        y = df[target_col].astype(float).values
        self.model.fit(X, y)
        self._last_features = df[self.feature_cols].tail(1).copy()
        return self

    def predict(self, horizon):
        preds = []
        row = self._last_features.copy()
        for _ in range(horizon):
            p = float(self.model.predict(row.values)[0])
            p = max(p, 0.0)
            preds.append(p)
            if 'lag_1' in row.columns:
                row['lag_1'] = p
        return np.array(preds)


class GradientBoostingForecaster(BaseForecaster):
    name = 'GradientBoosting'
    version = '1.0'

    def __init__(self, n_estimators=300, learning_rate=0.05, max_depth=6, random_state=42):
        from sklearn.ensemble import GradientBoostingRegressor
        self.model = GradientBoostingRegressor(
            n_estimators=n_estimators, learning_rate=learning_rate,
            max_depth=max_depth, random_state=random_state,
        )
        self.feature_cols = None
        self._last_features = None

    def fit(self, df, target_col='net_demand'):
        self.feature_cols = [c for c in df.columns if c not in FEATURE_EXCLUDE]
        X = df[self.feature_cols].values
        y = df[target_col].astype(float).values
        self.model.fit(X, y)
        self._last_features = df[self.feature_cols].tail(1).copy()
        return self

    def predict(self, horizon):
        preds = []
        row = self._last_features.copy()
        for _ in range(horizon):
            p = float(self.model.predict(row.values)[0])
            p = max(p, 0.0)
            preds.append(p)
            if 'lag_1' in row.columns:
                row['lag_1'] = p
        return np.array(preds)


def evaluate_model(model, train_df, test_df):
    """Fit on train, evaluate on test."""
    model.fit(train_df)
    y_true = test_df['net_demand'].astype(float).values
    y_pred = model.predict(len(test_df))
    return _metrics(y_true, y_pred)