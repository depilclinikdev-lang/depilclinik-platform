#!/bin/bash
set -e
set -o pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="backup-${DB_NAME}-${TIMESTAMP}.sql.gz"

echo "[$(date)] Iniciando respaldo de ${DB_NAME}..."

mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" --protocol=TCP "$DB_NAME" | gzip > "/tmp/${FILENAME}"

aws s3 cp "/tmp/${FILENAME}" "s3://${AWS_S3_BUCKET_NAME}/depilclinik/db-backups/${FILENAME}"

rm "/tmp/${FILENAME}"

echo "[$(date)] Respaldo ${FILENAME} subido correctamente a S3."