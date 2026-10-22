#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP=${1:?Provide YiJianApp source directory}
TEMP=$(mktemp -d)
trap 'rm -rf "$TEMP"' EXIT
swiftc "$APP/Sources/YiJianApp/Engine/HexagramIdentifier.swift" "$APP/Sources/YiJianApp/Engine/HexagramLine.swift" "$APP/Sources/YiJianApp/Engine/ZhuXiReading.swift" "$APP/Sources/YiJianApp/Engine/CastingResult.swift" "$ROOT/tests/native-oracle.swift" -o "$TEMP/oracle"
"$TEMP/oracle" > "$ROOT/tests/native-oracle.json"
printf 'Generated native oracle for all 4096 casts.\n'
