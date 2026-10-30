# PriceLens notifications deployment

The notification backend uses Firestore, Firebase Cloud Messaging, RevenueCat,
Cloud Run, and Cloud Scheduler.

## Required secrets

- `REVENUECAT_SECRET_API_KEY`: RevenueCat secret key used only by the API.
- `SCHEDULER_SECRET`: random secret shared by Cloud Run and Cloud Scheduler.

Never use the public `goog_...` SDK key as `REVENUECAT_SECRET_API_KEY`.

## Google Cloud setup

Run in Google Cloud Shell with project `pricelens-506120` selected:

```bash
gcloud services enable firestore.googleapis.com cloudscheduler.googleapis.com run.googleapis.com cloudbuild.googleapis.com fcm.googleapis.com

gcloud firestore databases create --location=europe-west1 --type=firestore-native
```

Skip the second command if the project's Firestore database already exists.

Grant the Cloud Run runtime service account Firestore and FCM access:

```bash
PROJECT_ID="pricelens-506120"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/firebasecloudmessaging.admin"
```

Deploy the API with the existing production variables plus the two new secrets:

```bash
gcloud run services update pricelens-api --region=europe-west1 \
  --update-env-vars="REVENUECAT_SECRET_API_KEY=REPLACE_ME,SCHEDULER_SECRET=REPLACE_WITH_RANDOM_SECRET"
```

Create the periodic price check (every six hours):

```bash
gcloud scheduler jobs create http pricelens-price-alerts \
  --location=europe-west1 \
  --schedule="0 */6 * * *" \
  --uri="https://pricelens-api-44ftuum65a-ew.a.run.app/notifications/internal/check-price-alerts" \
  --http-method=POST \
  --headers="x-scheduler-secret=REPLACE_WITH_RANDOM_SECRET,Content-Type=application/json" \
  --message-body="{}" \
  --time-zone="Europe/Lisbon"
```

After changing native notification configuration, create and distribute a new
Android AAB. Users must enable Notifications in Profile after signing in.
