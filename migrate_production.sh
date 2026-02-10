#!/bin/bash
HOST="nozomi.proxy.rlwy.net"
PORT="44099"
USER="root"
PASS="dPndxwtpljRtzfHJycRhEONfZrAfHYSE"
DB="railway"

echo "🚀 Starting Production Database Migration..."

echo "1/3 Creating Base Tables (tables-railway.sql)..."
mysql -h "$HOST" -P "$PORT" -u "$USER" -p"$PASS" "$DB" < database/schema/tables-railway.sql

echo "2/3 Seeding Base Data (sample-data.sql)..."
mysql -h "$HOST" -P "$PORT" -u "$USER" -p"$PASS" "$DB" < database/seeds/sample-data.sql

echo "3/3 Applying Journey Planning Features (001_journey_planning_tables.sql)..."
mysql -h "$HOST" -P "$PORT" -u "$USER" -p"$PASS" "$DB" < database/migrations/001_journey_planning_tables.sql

echo "4/4 Applying Saved Places Feature (005_create_saved_places.sql)..."
mysql -h "$HOST" -P "$PORT" -u "$USER" -p"$PASS" "$DB" < database/schema/005_create_saved_places.sql

echo "✅ Migration Complete!"
