cd $TRAVIS_BUILD_DIR
unamestr=`uname`
echo TRAVIS_BRANCH=$TRAVIS_BRANCH
## Set a branch variable so we can detect the current branch in webpack if we're in staging or develop branch
if [ $unamestr = 'Linux' ] && [ $TRAVIS_BRANCH = 'staging' ]
then
    export BRANCH=$TRAVIS_BRANCH
fi
if [ $unamestr = 'Linux' ] && [ $TRAVIS_BRANCH = 'develop' ] && [ -z $TRAVIS_PULL_REQUEST_BRANCH ]
then
    export BRANCH=$TRAVIS_BRANCH
fi

## Build the hash wallet if wer're on Linux
if [ "$unamestr" == 'Linux' ]
then
    npm run build-hash
fi
## Build the binaries if this is a release tag
if [ $TRAVIS_TAG ]
then
    npm run-script package
fi
