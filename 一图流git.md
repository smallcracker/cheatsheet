
# Git Cheat Sheet

## Setup
Set the name and email that will be attached to your commits and tags

```bash
$ git config --global user.name "Danny Adams"
$ git config --global user.email "my-email@gmail.com"
```

## Start a Project
Create a local repo (omit `<directory>` to initialise the current directory as a git repo

```bash
$ git init <directory>
```

Download a remote repo

```bash
$ git clone <url>
```

## Make a Change
Add a file to staging

```bash
$ git add <file>
```

Stage all files

```bash
$ git add .
```

Commit all staged files to git

```bash
$ git commit -m "commit message"
```

Add all changes made to tracked files & commit

```bash
$ git commit -am "commit message"
```

## Basic Concepts

- **main**: default development branch
- **origin**: default upstream repo
- **HEAD**: current branch
- **HEAD^**: parent of HEAD
- **HEAD~4**: great-great grandparent of HEAD

## Branches
List all local branches. Add `-r` flag to show all remote branches. `-a` flag for all branches.

```bash
$ git branch
```

Create a new branch

```bash
$ git branch <new-branch>
```

Switch to a branch & update the working directory

```bash
$ git checkout <branch>
```

Create a new branch and switch to it

```bash
$ git checkout -b <new-branch>
```

Delete a merged branch

```bash
$ git branch -d <branch>
```

Delete a branch, whether merged or not

```bash
$ git branch -D <branch>
```

Add a tag to current commit (often used for new version releases)

```bash
$ git tag <tag-name>
```

## Merging
Merge branch a into branch b. Add `--no-ff` option for no-fast-forward merge

```bash
$ git checkout b
$ git merge a
```

Merge & squash all commits into one new commit

```bash
$ git merge --squash a
```

## Rebasing
Rebase feature branch onto main (to incorporate new changes made to main). Prevents unnecessary merge commits into feature, keeping history clean

```bash
$ git checkout feature
$ git rebase main
```

Interactively clean up a branches commits before rebasing onto main

```bash
$ git rebase -i main
```

Interactively rebase the last 3 commits on current branch

```bash
$ git rebase -i Head~3
```

## Undoing Things
Move (&/or rename) a file & stage move

```bash
$ git mv <existing_path> <new_path>
```

Remove a file from working directory & staging area, then stage the removal

```bash
$ git rm <file>
```

Remove from staging area only

```bash
$ git rm --cached <file>
```

View a previous commit (READ only)

```bash
$ git checkout <commit_ID>
```

Create a new commit, reverting the changes from a specified commit

```bash
$ git revert <commit_ID>
```

Go back to a previous commit & delete all commits ahead of it (revert is safer). Add `--hard` flag to also delete workspace changes (BE VERY CAREFUL)

```bash
$ git reset <commit_ID>
```

## Review your Repo
List new or modified files not yet committed

```bash
$ git status
```

List commit history, with respective IDs

```bash
$ git log --oneline
```

Show changes to unstaged files. For changes to staged files, add `--cached` option

```bash
$ git diff
```

Show changes between two commits

```bash
$ git diff commit1_ID commit2_ID
```

## Stashing
Store modified & staged changes. To include untracked files, add `-u` flag. For untracked & ignored files, add `-a` flag.

```bash
$ git stash
```

As above, but add a comment.

```bash
$ git stash save "comment"
```

Partial stash. Stash just a single file, a collection of files, or individual changes from within files

```bash
$ git stash -p
```

List all stashes

```bash
$ git stash list
```

Re-apply the stash without deleting it

```bash
$ git stash apply
```

Re-apply the stash at index 2, then delete it from the stash list. Omit stash@{n} to pop the most recent stash.

```bash
$ git stash pop stash@{2}
```

Show the diff summary of stash 1. Pass the `-p` flag to see the full diff.

```bash
$ git stash show stash@{1}
```

Delete stash at index 1. Omit stash@{n} to delete last stash made

```bash
$ git stash drop stash@{1}
```

Delete all stashes

```bash
$ git stash clear
```

## Synchronizing
Add a remote repo

```bash
$ git remote add <alias> <url>
```

View all remote connections. Add `-v` flag to view urls.

```bash
$ git remote
```

Remove a connection

```bash
$ git remote remove <alias>
```

Rename a connection

```bash
$ git remote rename <old> <new>
```

Fetch all branches from remote repo (no merge)

```bash
$ git fetch <alias>
```

Fetch a specific branch

```bash
$ git fetch <alias> <branch>
```

Fetch the remote repo's copy of the current branch, then merge

```bash
$ git pull
```

Move (rebase) your local changes onto the top of new changes made to the remote repo (for clean, linear history)

```bash
$ git pull --rebase <alias>
```

Upload local content to remote repo

```bash
$ git push <alias>
```

Upload to a branch (can then pull request)

```bash
$ git push <alias> <branch>
```