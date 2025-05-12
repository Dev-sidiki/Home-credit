# backend/app.py
# backend/app.py
"""
API Flask principale — Home-Credit
v3 quater + hot-fix + creator-email + model-scoring :
  • lecture limitée ou non suivant ?all=true
  • SK_ID_CURR toujours sauvé en int
  • recherche tolérante (int ou str)
  • ajout de created_by_email dans la réponse
  • calcul du score via le modèle LightGBM à chaque création ou mise à jour
"""

import math
import pathlib
from datetime import datetime, timezone, timedelta

import joblib
import numpy as np
import pandas as pd
from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient

# --------------------------------------------------------------------------- #
#  Configuration MongoDB & JWT
# --------------------------------------------------------------------------- #
MONGO_URI      = "mongodb://localhost:27017/"
JWT_SECRET_KEY = (
    "1412ce1f328c2b77877e1eb697a570096050d63be03a51aa7d5062f6c4793d84"
)

client = MongoClient(MONGO_URI)
db     = client["home_credit_db"]
col    = db["dossiers"]

# --------------------------------------------------------------------------- #
#  Chargement du modèle LightGBM
# --------------------------------------------------------------------------- #
MODEL_PATH = pathlib.Path(__file__).resolve().parent / "modele" / "model_lightgbm.pkl"
model = joblib.load(str(MODEL_PATH))

# Liste des 19 features que le modèle a vues à l'entraînement
FEATURES_FOR_MODEL = [
    "CODE_GENDER",
    "DAYS_BIRTH",
    "DAYS_EMPLOYED",
    "NAME_FAMILY_STATUS",
    "CNT_CHILDREN",
    "CNT_FAM_MEMBERS",
    "NAME_EDUCATION_TYPE",
    "NAME_INCOME_TYPE",
    "OCCUPATION_TYPE",
    "ORGANIZATION_TYPE",
    "NAME_HOUSING_TYPE",
    "FLAG_OWN_CAR",
    "OWN_CAR_AGE",
    "FLAG_OWN_REALTY",
    "AMT_INCOME_TOTAL",
    "AMT_CREDIT",
    "AMT_ANNUITY",
    "AMT_GOODS_PRICE",
    "DAYS_LAST_PHONE_CHANGE",
]

def compute_model_score(payload: dict) -> int:
    """
    Calcule le score via le modèle LightGBM :
      - construit un DataFrame à partir de payload
      - encode les catégorielles en codes entiers
      - prédit la proba de défaut
      - renvoie 1000 - proba*1000 arrondi à l'entier
    """
    df = pd.DataFrame([payload], columns=FEATURES_FOR_MODEL)
    cat_cols = [
        'CODE_GENDER','NAME_FAMILY_STATUS','NAME_EDUCATION_TYPE',
        'NAME_INCOME_TYPE','OCCUPATION_TYPE','ORGANIZATION_TYPE',
        'NAME_HOUSING_TYPE','FLAG_OWN_CAR','FLAG_OWN_REALTY'
    ]
    for c in cat_cols:
        df[c] = df[c].astype('category').cat.codes

    X     = df.values.astype(float)
    proba = model.booster_.predict(X)[0]
    return int(1000 - round(proba * 1000))


# --------------------------------------------------------------------------- #
#  Flask
# --------------------------------------------------------------------------- #
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
CORS(app)
jwt = JWTManager(app)


# --------------------------------------------------------------------------- #
#  Helpers
# --------------------------------------------------------------------------- #
def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def make_token(user):
    return create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": user["role"]},
        expires_delta=timedelta(hours=8)
    )

def clean_nan(doc: dict) -> dict:
    return {
        k: (None if isinstance(v, float) and math.isnan(v) else v)
        for k, v in doc.items()
    }

def dossier_to_json(d: dict) -> dict:
    d = d.copy()
    d["id"] = str(d.pop("_id"))

    creator_id = d.get("created_by")
    d["created_by"] = str(creator_id) if creator_id else None

    created_by_email = None
    if creator_id:
        u = db.users.find_one({"_id": ObjectId(creator_id)}, {"email":1})
        created_by_email = u.get("email") if u else None
    d["created_by_email"] = created_by_email

    for fld in ("created_at","updated_at"):
        if isinstance(d.get(fld), datetime):
            d[fld] = d[fld].isoformat()

    return clean_nan(d)


# --------------------------------------------------------------------------- #
#  Authentification
# --------------------------------------------------------------------------- #
@app.post("/auth/register")
def register():
    d = request.json or {}
    if not all(k in d for k in ("name","email","password")):
        return jsonify(msg="Champs manquants"),400
    if db.users.find_one({"email": d["email"]}):
        return jsonify(msg="Email déjà utilisé"),409

    user = {
        "name":       d["name"],
        "email":      d["email"],
        "password":   generate_password_hash(d["password"]),
        "role":       "user",
        "created_at": utc_now(),
    }
    user["_id"] = db.users.insert_one(user).inserted_id
    return jsonify(access_token=make_token(user)),201

@app.post("/auth/login")
def login():
    d    = request.json or {}
    user = db.users.find_one({"email": d.get("email")})
    if not user or not check_password_hash(user["password"], d.get("password","")):
        return jsonify(msg="Mauvais identifiants"),401
    return jsonify(access_token=make_token(user))

@app.get("/auth/me")
@jwt_required()
def me():
    uid  = get_jwt_identity()
    user = db.users.find_one({"_id":ObjectId(uid)}, {"password":0})
    user["id"] = str(user.pop("_id"))
    return jsonify(user)

@app.put("/auth/me")
@jwt_required()
def update_me():
    uid  = get_jwt_identity()
    body= request.json or {}
    if "email" in body and db.users.find_one(
        {"email":body["email"],"_id":{"$ne":ObjectId(uid)}}):
        return jsonify(msg="Email déjà utilisé"),409
    if body.get("password"):
        body["password"] = generate_password_hash(body["password"])
    db.users.update_one({"_id":ObjectId(uid)},{"$set":body})
    return jsonify(msg="OK")


# --------------------------------------------------------------------------- #
#  Dossiers
# --------------------------------------------------------------------------- #
def _next_sk_id() -> int:
    last = col.find_one(sort=[("SK_ID_CURR",-1)])
    return (last["SK_ID_CURR"] if last else 100000) + 1

@app.get("/dossiers")
@jwt_required(optional=True)
def list_dossiers():
    """
    ?client_id=xxxx     → tous les dossiers de ce client
    ?limit=n (défaut 100)  → limite sur les plus récents, -1 = illimité
    ?all=true           → ignore le filtre « mes créations »
    """
    q = {}
    if cid := request.args.get("client_id"):
        q["SK_ID_CURR"] = int(cid)
    if not request.args.get("all"):
        if get_jwt_identity():
            q["created_by"] = ObjectId(get_jwt_identity())
        else:
            return jsonify([])

    limit  = int(request.args.get("limit",100))
    cursor = col.find(q).sort("created_at",-1)
    if limit != -1:
        cursor = cursor.limit(limit)
    return jsonify([dossier_to_json(d) for d in cursor])

@app.post("/dossiers")
@jwt_required()
def create_dossier():
    body = request.json or {}

    # ← MODIFICATION ICI : on conserve d'abord SK_ID_CURR s'il est fourni
    if "SK_ID_CURR" in body:
        body["SK_ID_CURR"] = int(body["SK_ID_CURR"])
    elif body.get("new_client"):
        body["SK_ID_CURR"] = _next_sk_id()
    else:
        return jsonify(msg="SK_ID_CURR requis"),400

    body["score"]      = compute_model_score(body)
    body["created_by"] = ObjectId(get_jwt_identity())
    body["created_at"] = utc_now()
    body["updated_at"] = utc_now()

    col.insert_one(body)
    return jsonify(msg="Créé", SK_ID_CURR=body["SK_ID_CURR"]),201

@app.put("/dossiers/<dossier_id>")
@jwt_required()
def update_dossier(dossier_id):
    dos = col.find_one({"_id":ObjectId(dossier_id)})
    if not dos:
        return jsonify(msg="Introuvable"),404

    body = request.json or {}
    body.pop("created_by", None)
    body.pop("created_by_email", None)
    body.pop("id", None)

    body["updated_at"] = utc_now()
    merged = { **dos, **body }
    body["score"] = compute_model_score(merged)

    col.update_one({"_id":ObjectId(dossier_id)},{"$set":body})
    return jsonify(msg="OK")

@app.route("/dossiers/<dossier_id>", methods=["GET","DELETE"])
@jwt_required(optional=True)
def dossier_detail(dossier_id):
    dos = col.find_one({"_id":ObjectId(dossier_id)})
    if not dos:
        return jsonify(msg="Introuvable"),404
    if request.method == "GET":
        return jsonify(dossier_to_json(dos))
    if not get_jwt_identity():
        return jsonify(msg="Authentification requise"),401
    col.delete_one({"_id":ObjectId(dossier_id)})
    return jsonify(msg="Supprimé")


# --------------------------------------------------------------------------- #
#  Analytics / prédiction / historique / stats
# --------------------------------------------------------------------------- #
features_simples = [
    'score','TARGET','CODE_GENDER','DAYS_BIRTH','DAYS_EMPLOYED',
    'NAME_FAMILY_STATUS','CNT_CHILDREN','CNT_FAM_MEMBERS',
    'NAME_EDUCATION_TYPE','NAME_INCOME_TYPE','OCCUPATION_TYPE',
    'ORGANIZATION_TYPE','NAME_HOUSING_TYPE','FLAG_OWN_CAR',
    'OWN_CAR_AGE','FLAG_OWN_REALTY','AMT_INCOME_TOTAL',
    'AMT_CREDIT','AMT_ANNUITY','AMT_GOODS_PRICE',
    'DAYS_LAST_PHONE_CHANGE'
]

def _match_id(client_id: int):
    return {"$in":[client_id,str(client_id)]}

@app.get("/client/<int:client_id>")
def get_client_data(client_id):
    proj = {f:1 for f in features_simples}
    doc  = col.find_one({"SK_ID_CURR":_match_id(client_id)},projection=proj)
    if not doc:
        return jsonify(status="error",message="Client non trouvé"),404
    doc.pop("_id",None)
    return jsonify(status="ok",client=clean_nan(doc))

@app.post("/predict/<int:client_id>")
def predict(client_id):
    doc = col.find_one({"SK_ID_CURR": _match_id(client_id)}, {"score": 1})
    if not doc:
        return jsonify(status="error",message="Client not found"),404
    db.score_history.insert_one({
        "SK_ID_CURR":client_id,
        "timestamp":utc_now(),
        "score":int(doc["score"])
    })
    return jsonify(status="ok",score=int(doc["score"]))

@app.get("/history/<int:client_id>")
def history(client_id):
    docs = list(db.score_history.find({"SK_ID_CURR":client_id}).sort("timestamp",1))
    hist = [{"timestamp":d["timestamp"].isoformat(),"score":d["score"]} for d in docs]
    return jsonify(status="ok",history=hist)

@app.get("/stats/<feature>/<int:client_id>")
def get_feature_stats(feature,client_id):
    stat       = db.feature_stats.find_one({"_id":feature})
    client_doc = col.find_one({"SK_ID_CURR":_match_id(client_id)},{feature:1,"_id":0})
    if not stat or not client_doc:
        return jsonify(status="error",message="Stat ou client introuvable"),404

    if stat["type"]=="numeric":
        val = client_doc.get(feature)
        stat["client_bucket"] = (
            int(np.digitize([val],stat["histogram"]["bins"])[0])
            if val is not None else None
        )
    else:
        stat["client_value"] = client_doc.get(feature)
    return jsonify(status="ok",stat=stat)


# --------------------------------------------------------------------------- #
@app.get("/meta/options")
def meta_options():
    doc = db.meta_options.find_one({"_id":"categorical"},{"_id":0})
    if not doc:
        return jsonify(msg="Lance scripts/create_meta_options.py"),500
    return jsonify(doc)

@app.get("/")
def home():
    return jsonify(msg="API opérationnelle")


# --------------------------------------------------------------------------- #
if __name__=="__main__":
    app.run(debug=True)
