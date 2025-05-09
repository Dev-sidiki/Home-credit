import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

# 🔹 Chargement du fichier CSV
df = pd.read_csv("data/application_train.csv")
df.set_index("SK_ID_CURR", inplace=True)  # On met l’ID client en index

# 🔹 Route de test
@app.route("/")
def home():
    return jsonify({"message": "API opérationnelle"})

# 🔹 Route pour récupérer les infos d’un client
@app.route("/client/<int:client_id>")
def get_client_data(client_id):
    if client_id in df.index:
        client_data = df.loc[client_id].to_dict()
        # Nettoyage des NaN → None (pour JSON valide)
        cleaned_data = {k: (None if pd.isna(v) else v) for k, v in client_data.items()}
        return jsonify({"status": "ok", "client": cleaned_data})
    else:
        return jsonify({"status": "error", "message": "Client non trouvé"}), 404

if __name__ == "__main__":
    app.run(debug=True)
