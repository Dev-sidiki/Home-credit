# backend/scripts/compute_stats.py

from datetime import datetime, timezone
import numpy as np
import pandas as pd
from pymongo import MongoClient

# --------------------------------------------------------------------------- #
client  = MongoClient("mongodb://localhost:27017/")
db      = client["home_credit_db"]
dossiers = db["dossiers"]
stats    = db["feature_stats"]

df = pd.DataFrame(list(dossiers.find({}, projection={"_id": 0})))

# Ne garder que les clients défaillants
df_bad = df[df["TARGET"] == 1]

# --------------------------------------------------------------------------- #
num_feats = [
    "DAYS_BIRTH", "DAYS_EMPLOYED", "DAYS_LAST_PHONE_CHANGE",
    "CNT_CHILDREN", "CNT_FAM_MEMBERS",
    "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE"
]
cat_feats = [
    "CODE_GENDER", "NAME_FAMILY_STATUS", "NAME_EDUCATION_TYPE",
    "NAME_INCOME_TYPE", "OCCUPATION_TYPE", "NAME_HOUSING_TYPE"
]

# --------------------------------------------------------------------------- #
#  Numériques
# --------------------------------------------------------------------------- #
for feat in num_feats:
    col_bad = df_bad[feat].dropna().astype(float)

    # Calcul de l'histogramme uniquement pour les défaillants (TARGET=1)
    counts_bad, bins = np.histogram(col_bad, bins=10)

    # Calcul des percentiles pour les défaillants
    percentiles_bad = np.percentile(col_bad, [10, 50, 90]).tolist()

    doc = {
        "_id": feat,
        "type": "numeric",
        "histogram": {
            "bins": bins.tolist(),
            "counts": {"1": counts_bad.tolist()}
        },
        "percentiles": {
            "1": dict(zip(["10", "50", "90"], percentiles_bad))
        },
        "last_updated": datetime.now(timezone.utc)
    }
    stats.replace_one({"_id": feat}, doc, upsert=True)

# --------------------------------------------------------------------------- #
#  Catégorielles
# --------------------------------------------------------------------------- #
for feat in cat_feats:
    # On regroupe uniquement pour les défaillants
    grp_bad = df_bad.groupby([feat, "TARGET"]).size().unstack(fill_value=0)

    # Création des catégories uniquement pour TARGET=1
    categories = {
        cat: {"1": int(row.get(1, 0))}
        for cat, row in grp_bad.iterrows()
    }

    doc = {
        "_id": feat,
        "type": "categorical",
        "categories": categories,
        "last_updated": datetime.now(timezone.utc)
    }
    stats.replace_one({"_id": feat}, doc, upsert=True)

print("✅  Stats recalculées et enregistrées.")
