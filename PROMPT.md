Always read `./progress.txt` in full before starting the task.

If you discover general findings relevant to future tasks, append them to `./progress.txt`. Only include findings that apply broadly, not task-specific details.

After completing the task, append any new findings to `./progress.txt` that match these criteria:
* Patterns discovered (e.g. "this codebase uses X for Y")
* Gotchas encountered (e.g. "don't forget to update Z when changing W")  
* Useful component or module locations (e.g. "auth logic lives in X")
* Do not add task-specific details or anything that won't apply to future tasks
* Do not duplicate existing entries — read what's there before appending

When all tasks are complete:
* Migrate broadly useful findings from `progress.txt` into the appropriate section of `AGENTS.md`
* Remove entries from `progress.txt` that are now covered by `AGENTS.md` or are no longer relevant
* Run `touch DONE`