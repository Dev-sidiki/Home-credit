# load_to_mongo.py

import pandas as pd
import numpy as np
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db     = client["home_credit_db"]
col    = db["clients_features"]

df = pd.read_csv("data/application_train.csv").set_index("SK_ID_CURR")
df['DAYS_EMPLOYED'] = df['DAYS_EMPLOYED'].replace(365243, np.nan)
df['AGE_YEARS']      = (-df['DAYS_BIRTH']    / 365).astype(int)
df['EMPLOYED_YEARS'] = (-df['DAYS_EMPLOYED'] / 365).round(0).astype("Int64")
for f in ['FLAG_OWN_CAR','FLAG_OWN_REALTY']:
    df[f] = df[f].map({'Y': True, 'N': False})
for f in ['CNT_CHILDREN','CNT_FAM_MEMBERS','AMT_ANNUITY','AMT_CREDIT','AMT_GOODS_PRICE']:
    df[f] = df[f].dropna().astype(int)

# score selon TARGET
rng = np.random.default_rng(42)
df['score'] = np.where(
    df['TARGET'] == 0,
    rng.integers(501, 1001, size=len(df)),
    rng.integers(0, 500, size=len(df))
)

records = df.reset_index()[[
    'SK_ID_CURR','score','TARGET','CODE_GENDER','AGE_YEARS','NAME_FAMILY_STATUS',
    'CNT_CHILDREN','CNT_FAM_MEMBERS','NAME_EDUCATION_TYPE','NAME_INCOME_TYPE',
    'OCCUPATION_TYPE','ORGANIZATION_TYPE','EMPLOYED_YEARS','NAME_HOUSING_TYPE',
    'FLAG_OWN_CAR','OWN_CAR_AGE','FLAG_OWN_REALTY',
    'AMT_INCOME_TOTAL','AMT_CREDIT','AMT_ANNUITY','AMT_GOODS_PRICE',
    'DAYS_LAST_PHONE_CHANGE'
]].to_dict("records")

col.drop()
col.insert_many(records)
print(f"{len(records)} documents insérés dans clients_features (avec score).")
