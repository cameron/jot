#! /bin/bash

sessionName=jot

tmux has-session -t $sessionName

if [ $? -ne 0 ]; then
    tmux \
        new-session -d -s $sessionName -n emacs 'emacs jot' \;\
    set-option set-remain-on-exit on \;\
    new-window -n git\;\
    new-window -n docker \;\
    selectw -t emacs
fi

tmux attach -d -t $sessionName
