# backend/scripts/create_meta_options.py

import pathlib
import sys

import pandas as pd
from pymongo import MongoClient

# --------------------------------------------------------------------------- #
# Connexion MongoDB
# --------------------------------------------------------------------------- #
client = MongoClient("mongodb://localhost:27017/")
db     = client["home_credit_db"]

# --------------------------------------------------------------------------- #
# Paramètres
# --------------------------------------------------------------------------- #
# On inclut de nouveau CODE_GENDER, mais on exclut les 'XNA'
CATEG = [
    "CODE_GENDER",
    "NAME_FAMILY_STATUS",
    "NAME_EDUCATION_TYPE",
    "NAME_INCOME_TYPE",
    "OCCUPATION_TYPE",
    "ORGANIZATION_TYPE",
    "NAME_HOUSING_TYPE",
    "FLAG_OWN_CAR",
    "FLAG_OWN_REALTY",
]

csv = pathlib.Path(__file__).resolve().parent.parent / "data" / "application_train.csv"
if not csv.exists():
    print("CSV manquant :", csv)
    sys.exit(1)

# --------------------------------------------------------------------------- #
# Génération & insertion
# --------------------------------------------------------------------------- #
df = pd.read_csv(csv, usecols=CATEG)

# Filtrer les XNA
df = df[df["CODE_GENDER"] != "XNA"]

opts = {c: sorted(df[c].dropna().unique().tolist()) for c in CATEG}

db.meta_options.replace_one(
    {"_id": "categorical"},
    {"_id": "categorical", **opts},
    upsert=True
)

print("✅  Options catégorielles enregistrées.")
