#!/usr/bin/env bash
set -e

echo "==> Creating src/lib/apiFetch.js"
mkdir -p src/lib

cat > src/lib/apiFetch.js <<'EOT'
import { supabaseBrowser } from "./supabase/client";

export async function apiFetch(path, options = {}) {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(path, { ...options, headers, cache: "no-store" });
}
EOT

patch_file () {
  local FILE="$1"
  local IMPORT_PATH="$2"

  echo "==> Patching: $FILE"

  # Add "use client" at very top if missing
  local FIRSTLINE
  FIRSTLINE="$(head -n 1 "$FILE" 2>/dev/null || true)"
  if [[ "$FIRSTLINE" != "\"use client\";" && "$FIRSTLINE" != "'use client';" ]]; then
    perl -0777 -pe 's/\A/"use client";\n\n/' -i "$FILE"
  fi

  # Add apiFetch import if missing
  if ! grep -q 'apiFetch' "$FILE"; then
    perl -0777 -pe 's@(^([ \t]*import[^\n]*\n)+)@$1import { apiFetch } from "'"$IMPORT_PATH"'";\n@ms' -i "$FILE"
  fi

  # Replace fetch("/api/ with apiFetch("/api/
  perl -pi -e 's/fetch\("\/api\//apiFetch("\/api\//g' "$FILE"
  perl -pi -e "s/fetch\('\/api\//apiFetch('\/api\//g" "$FILE"

  echo "✅ Done: $FILE"
}

patch_file "src/app/dashboard/hri-assessment/page.jsx" "../../lib/apiFetch"
patch_file "src/app/dashboard/settings/page.jsx" "../../lib/apiFetch"
patch_file "src/app/dashboard/assessments/page.jsx" "../../lib/apiFetch"
patch_file "src/app/dashboard/CurrentAssessmentCard.jsx" "../../lib/apiFetch"
patch_file "src/app/dashboard/scores/page.jsx" "../../lib/apiFetch"
patch_file "src/app/dashboard/assessment/AssessmentClient.jsx" "../../../lib/apiFetch"
patch_file "src/app/dashboard/employee-pulse/page.jsx" "../../lib/apiFetch"

echo "==> Restarting clean..."
rm -rf .next .turbo
npm run dev
