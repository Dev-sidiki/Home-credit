# app.py

import json, math, numpy as np
from datetime import datetime
from flask import Flask, Response, jsonify
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db     = client["home_credit_db"]
col    = db["clients_features"]

features_simples = [
    'score','TARGET','CODE_GENDER','AGE_YEARS','NAME_FAMILY_STATUS','CNT_CHILDREN',
    'CNT_FAM_MEMBERS','NAME_EDUCATION_TYPE','NAME_INCOME_TYPE','OCCUPATION_TYPE',
    'ORGANIZATION_TYPE','EMPLOYED_YEARS','NAME_HOUSING_TYPE','FLAG_OWN_CAR',
    'OWN_CAR_AGE','FLAG_OWN_REALTY','AMT_INCOME_TOTAL','AMT_CREDIT',
    'AMT_ANNUITY','AMT_GOODS_PRICE','DAYS_LAST_PHONE_CHANGE'
]

def clean_nan(doc):
    return {k: (None if isinstance(v,float) and math.isnan(v) else v) for k,v in doc.items()}

@app.route("/")
def home():
    return jsonify({"message":"API opérationnelle"})

@app.route("/client/<int:client_id>")
def get_client_data(client_id):
    proj = {f:1 for f in features_simples}
    doc = col.find_one({"SK_ID_CURR":client_id},projection=proj)
    if not doc:
        return jsonify({"status":"error","message":"Client non trouvé"}),404
    doc.pop("_id",None)
    return jsonify({"status":"ok","client":clean_nan(doc)})

@app.route("/predict/<int:client_id>", methods=["POST"])
def predict(client_id):
    doc = col.find_one({"SK_ID_CURR":client_id},{"score":1})
    if not doc:
        return jsonify({"status":"error","message":"Client not found"}),404
    # stocker l'historique
    db["score_history"].insert_one({
        "SK_ID_CURR": client_id,
        "timestamp": datetime.utcnow(),
        "score": int(doc["score"])
    })
    return jsonify({"status":"ok","score": int(doc["score"])})

@app.route("/history/<int:client_id>")
def history(client_id):
    docs = list(db["score_history"].find({"SK_ID_CURR":client_id}).sort("timestamp",1))
    hist = [{"timestamp":d["timestamp"].isoformat(),"score":d["score"]} for d in docs]
    return jsonify({"status":"ok","history":hist})

@app.route("/stats/<feature>/<int:client_id>")
def get_feature_stats(feature, client_id):
    stat = db["feature_stats"].find_one({"_id":feature})
    client_doc = col.find_one({"SK_ID_CURR":client_id},{feature:1,"_id":0})
    if not stat or not client_doc:
        return jsonify({"status":"error","message":"Stat ou client introuvable"}),404
    if stat["type"]=="numeric":
        val = client_doc.get(feature)
        stat["client_bucket"] = int(np.digitize([val], stat["histogram"]["bins"])[0]) if val is not None else None
    else:
        stat["client_value"] = client_doc.get(feature)
    return jsonify({"status":"ok","stat":stat})

if __name__ == "__main__":
    app.run(debug=True)
