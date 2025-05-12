#Pour le frontend, se deplaer dans le dossier frontend puis lancer les commandes ci-dessous:
===> npm install puis npm start

#Pour le backend:

==> Se déplacer dans le dossier backend puis exécuter ===> python app.py

Puis lancer les scripts (backends/scripts) dans cet ordre:
python load_to_mongo.py : pour peupler la bdd mongo avec les lignes du .csv ainsi que des données factices tel que l'email/nom
python create_meta_options.py: pour stocker en base les différentes selections parmis lesquelles l'utilisateur pourra choisir lors du formulaire de création de dossier 
python compute_stats.py : on stocke différentes data dans la bdd mongo afin de creer plusieurs graphiques comparatifs ( à l'avenir l'executer toutes les 24h avec un cron)
