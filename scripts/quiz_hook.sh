#!/usr/bin/env bash
# Claude Code PostToolUse-hook: kör quiz-regelkontrollen på en redigerad
# data/*.json-fil och matar tillbaka ev. varningar/fel till modellen.
# Läser hook-payloaden (JSON) på stdin.
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  */data/*.json)
    out=$(python3 scripts/validate_quiz.py "$f" 2>&1)
    if echo "$out" | grep -qE "VARNING|FEL"; then
      printf '%s' "$out" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:("Quiz-regelkontroll (CLAUDE_REGLER.md §2.9–2.11):\n"+.)}}'
    fi
    ;;
esac
exit 0
