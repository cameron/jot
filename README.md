# Legal Ease

A PDF viewer that makes legalese a lot less hard. 

# Developer Onboarding

Install [docker](www.docker.io). ([Instructions for OS X.](http://www.siliconfidential.com/articles/docker-coreos-osx/))
Install [fig](http://orchardup.github.io/fig/).


We currently have four containers -- postgresql, redis, the api server, and the web client served up via nginx.
They are all configured in fig.yml and managed by the fig cli tool.

### fig build

Forces a build of a new image. Provide one or more service names (the top-level keys of fig.yml) to only build that/those
images.

### fig up

Runs new containers created from the images, building the images first if they don't already exist. With `-d`, will run them
in the background. Give one ore more service names to not run everything.


## BE CAREFUL
Your commits should not commingle changes to the forked pdf.js repo, which is contained as a subtree at `client/pdf.js`, with changes to the main repo. See this [post](http://blogs.atlassian.com/2013/05/alternatives-to-git-submodule-git-subtree/) for details on how to push subtree changes to the subtree's upstream.
