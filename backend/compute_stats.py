# compute_stats.py
import numpy as np
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timezone

# 1) Connexion
client = MongoClient("mongodb://localhost:27017/")
db     = client["home_credit_db"]
clients = db["clients_features"]
stats   = db["feature_stats"]

# 2) Charger tout en DataFrame
df = pd.DataFrame(list(clients.find({}, projection={"_id":0})))

# 3) Définir vos features à statiser
features = [
  "CNT_CHILDREN", "CNT_FAM_MEMBERS", "AGE_YEARS",
  "EMPLOYED_YEARS", "AMT_INCOME_TOTAL", "AMT_CREDIT",
  "AMT_ANNUITY", "AMT_GOODS_PRICE", "DAYS_LAST_PHONE_CHANGE"
]
cat_feats = [
  "CODE_GENDER","NAME_FAMILY_STATUS","NAME_EDUCATION_TYPE",
  "NAME_INCOME_TYPE","OCCUPATION_TYPE","NAME_HOUSING_TYPE"
]

# 4) Pour chaque feature numérique
for feat in features:
    col = df[feat].dropna().astype(float)
    # créer bins (ex. 10 bins égaux)
    counts0, bins = np.histogram(col[df["TARGET"]==0], bins=10)
    counts1, _    = np.histogram(col[df["TARGET"]==1], bins=bins)
    # percentiles
    pct = {
      "0": np.percentile(col[df["TARGET"]==0], [10,50,90]).tolist(),
      "1": np.percentile(col[df["TARGET"]==1], [10,50,90]).tolist(),
      "all": np.percentile(col, [10,50,90]).tolist()
    }
    doc = {
      "_id": feat,
      "type": "numeric",
      "histogram": {
        "bins": bins.tolist(),
        "counts": {"0": counts0.tolist(), "1": counts1.tolist()}
      },
      "percentiles": {
        "0": dict(zip(["10","50","90"], pct["0"])),
        "1": dict(zip(["10","50","90"], pct["1"])),
        "all": dict(zip(["10","50","90"], pct["all"]))
      },
      "last_updated": datetime.now(timezone.utc)
    }
    stats.replace_one({"_id": feat}, doc, upsert=True)

# 5) Pour chaque feature catégorielle
for feat in cat_feats:
    grp = df.groupby([feat, "TARGET"]).size().unstack(fill_value=0)
    categories = {}
    for cat, row in grp.iterrows():
        categories[cat] = {"0": int(row.get(0,0)), "1": int(row.get(1,0))}
    doc = {
      "_id": feat,
      "type": "categorical",
      "categories": categories,
      "last_updated": datetime.now(timezone.utc)
    }
    stats.replace_one({"_id": feat}, doc, upsert=True)

print("Stats computed and stored.")
