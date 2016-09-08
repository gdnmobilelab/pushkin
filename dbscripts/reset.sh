#!/bin/bash

PROCS_FILES="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/p_*.sql"
for f in $PROCS_FILES
do
  # take action on each file. $f store current file name
  echo $f
  mysql -u root pushkin < $f
done

TRIGGER_FILES="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/t_*.sql"
for f in $TRIGGER_FILES
do
  echo $f
  # take action on each file. $f store current file name
  mysql -u root pushkin < $f
done

FUNCTION_FILES="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/f_*.sql"
for f in $FUNCTION_FILES
do
  echo $f
  # take action on each file. $f store current file name
  mysql -u root pushkin < $f
done