cp PLAN.md PLAN_TRACKER.md

while true; do
  TASK=$(grep -m1 "^- \[ \]" PLAN_TRACKER.md | sed 's/- \[ \] //')
  [ -z "$TASK" ] && break

  cat <<EOF | claude -p --dangerously-skip-permissions
Your current task is: $TASK
All previous tasks in PLAN.md are already completed. Do not re-evaluate or re-do them. Focus only on the current task.

$(cat PROMPT.md)
$(cat PLAN.md)
EOF
  
  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ]; then
    sed -i "s/- \[ \] $TASK/- [BLOCKED] $TASK/" PLAN_TRACKER.md
    break
  fi

  sed -i "s/- \[ \] $TASK/- [x] $TASK/" PLAN_TRACKER.md
done