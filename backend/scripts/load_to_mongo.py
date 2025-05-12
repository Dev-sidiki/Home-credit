# backend/scripts/load_to_mongo.py

import pathlib
import random
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from bson import ObjectId
from faker import Faker
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

# --------------------------------------------------------------------------- #
# Connexion MongoDB
# --------------------------------------------------------------------------- #
faker        = Faker()
client       = MongoClient("mongodb://localhost:27017/")
db           = client["home_credit_db"]
users_col    = db["users"]
dossiers_col = db["dossiers"]

# --------------------------------------------------------------------------- #
# 1) Création d’un pool d’utilisateurs “propres”
# --------------------------------------------------------------------------- #
if "users" in db.list_collection_names():
    users_col.drop()

num_users = 5
user_pool = []
for _ in range(num_users):
    name  = faker.name()
    email = faker.email()
    pwd   = generate_password_hash("password123")
    user = {
        "name":       name,
        "email":      email,
        "password":   pwd,
        "role":       "user",
        "created_at": datetime.now(timezone.utc),
    }
    user["_id"] = users_col.insert_one(user).inserted_id
    user_pool.append({"_id": user["_id"], "email": email})

print(f"✅  {len(user_pool)} utilisateurs créés dans 'users'")

# --------------------------------------------------------------------------- #
# 2) Chargement et nettoyage du CSV
# --------------------------------------------------------------------------- #
csv_path = pathlib.Path(__file__).resolve().parent.parent / "data" / "application_train.csv"
if not csv_path.exists():
    print("CSV manquant :", csv_path)
    exit(1)

df = pd.read_csv(csv_path).set_index("SK_ID_CURR")

# Exclure les enregistrements CODE_GENDER == 'XNA'
df = df[df["CODE_GENDER"] != "XNA"]

# --- Conserver les jours bruts et prendre l’absolu pour ne plus avoir de négatifs ---
# DAYS_BIRTH
df["DAYS_BIRTH"]             = df["DAYS_BIRTH"].abs()
# DAYS_EMPLOYED (remplacer la valeur fantôme 365243 par NaN puis abs)
df["DAYS_EMPLOYED"]          = df["DAYS_EMPLOYED"].replace(365243, np.nan).abs()
# DAYS_LAST_PHONE_CHANGE
df["DAYS_LAST_PHONE_CHANGE"] = df["DAYS_LAST_PHONE_CHANGE"].abs()

# Booléens voiture / immobilier
df["FLAG_OWN_CAR"]    = df["FLAG_OWN_CAR"].map({"Y": True, "N": False})
df["FLAG_OWN_REALTY"] = df["FLAG_OWN_REALTY"].map({"Y": True, "N": False})

# Remplissage des numériques manquants
for f in ["CNT_CHILDREN", "CNT_FAM_MEMBERS", "AMT_ANNUITY", "AMT_CREDIT", "AMT_GOODS_PRICE"]:
    df[f] = df[f].fillna(0).astype(int)

# Score aléatoire selon TARGET
rng = np.random.default_rng(42)
df["score"] = np.where(
    df["TARGET"] == 0,
    rng.integers(501, 1001, size=len(df)),
    rng.integers(0,   500,  size=len(df))
)

# Génération de prénoms / noms / emails
df["first_name"] = [faker.first_name() for _ in range(len(df))]
df["last_name"]  = [faker.last_name()  for _ in range(len(df))]
df["email"]      = [
    f"{fn.lower()}.{ln.lower()}@example.com"
    for fn, ln in zip(df["first_name"], df["last_name"])
]

now = datetime.now(timezone.utc)
df["created_at"] = now
df["updated_at"] = now

# --------------------------------------------------------------------------- #
# 3) Préparation & insertion
# --------------------------------------------------------------------------- #
records = []
for _, row in df.reset_index().iterrows():
    creator = random.choice(user_pool)
    doc = {
        "SK_ID_CURR":            int(row["SK_ID_CURR"]),
        "first_name":            row["first_name"],
        "last_name":             row["last_name"],
        "email":                 row["email"],
        "created_by":            creator["_id"],
        "created_by_email":      creator["email"],
        "created_at":            row["created_at"],
        "updated_at":            row["updated_at"],
        "score":                 int(row["score"]),
        "TARGET":                int(row["TARGET"]),
        "CODE_GENDER":           row["CODE_GENDER"],
        "DAYS_BIRTH":            int(row["DAYS_BIRTH"]),
        "DAYS_EMPLOYED":         (int(row["DAYS_EMPLOYED"])
                                    if not pd.isna(row["DAYS_EMPLOYED"])
                                    else None),
        "NAME_FAMILY_STATUS":    row["NAME_FAMILY_STATUS"],
        "CNT_CHILDREN":          int(row["CNT_CHILDREN"]),
        "CNT_FAM_MEMBERS":       int(row["CNT_FAM_MEMBERS"]),
        "NAME_EDUCATION_TYPE":   row["NAME_EDUCATION_TYPE"],
        "NAME_INCOME_TYPE":      row["NAME_INCOME_TYPE"],
        "OCCUPATION_TYPE":       row["OCCUPATION_TYPE"],
        "ORGANIZATION_TYPE":     row["ORGANIZATION_TYPE"],
        "NAME_HOUSING_TYPE":     row["NAME_HOUSING_TYPE"],
        "FLAG_OWN_CAR":          bool(row["FLAG_OWN_CAR"]),
        "OWN_CAR_AGE":           (int(row["OWN_CAR_AGE"])
                                    if not pd.isna(row["OWN_CAR_AGE"])
                                    else None),
        "FLAG_OWN_REALTY":       bool(row["FLAG_OWN_REALTY"]),
        "AMT_INCOME_TOTAL":      int(row["AMT_INCOME_TOTAL"]),
        "AMT_CREDIT":            int(row["AMT_CREDIT"]),
        "AMT_ANNUITY":           int(row["AMT_ANNUITY"]),
        "AMT_GOODS_PRICE":       int(row["AMT_GOODS_PRICE"]),
        "DAYS_LAST_PHONE_CHANGE":(
            int(row["DAYS_LAST_PHONE_CHANGE"])
            if not pd.isna(row["DAYS_LAST_PHONE_CHANGE"])
            else None
        ),
    }
    records.append(doc)

if "dossiers" in db.list_collection_names():
    dossiers_col.drop()

dossiers_col.insert_many(records)
print(f"✅  {len(records):,} dossiers créés dans la collection dossiers.")
