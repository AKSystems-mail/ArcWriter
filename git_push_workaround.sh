#!/bin/bash
echo "Starting git operations..." > push_log.txt
git add . >> push_log.txt 2>&1
git commit -m "Fix TypeScript syntax error in ScriptEditor.jsx" >> push_log.txt 2>&1
echo "Commit finished. Pushing..." >> push_log.txt
git push >> push_log.txt 2>&1
echo "Push finished." >> push_log.txt
git status >> push_log.txt 2>&1
