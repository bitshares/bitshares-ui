# This script clones an existing gh-pages repository and pushes updates
# from the newly compiled version into github.
# The GITHUB_TOKEN for authentication is stored in the encrypted
# variable in .travis.yml.

# The script assumes final releases are tagged
# using [2-9].[0-9].[0-9]{6} format, for example 2.0.180629
# Staging releases should always end in -rcx, using the following format:
# .+-rc[1-9]$

############
unamestr=`uname`
echo unamestr=$unamestr
echo TRAVIS_TAG=$TRAVIS_TAG
echo TRAVIS_BRANCH=$TRAVIS_BRANCH
echo TRAVIS_PULL_REQUEST_BRANCH=$TRAVIS_PULL_REQUEST_BRANCH

if [[ "$unamestr" == 'Linux' && -n $TRAVIS_TAG && $TRAVIS_BRANCH =~ [2-9]\.[0-9]\.[0-9]{6}$ ]]
then
    ## wallet.bitshares.org subdomain (independent repo)
    echo "Pushing new wallet subdomain repo"
    git clone https://github.com:${GITHUB_TOKEN}@github.com/${WALLET_REPO} $TRAVIS_BUILD_DIR/wallet.bitshares.org
    cd $TRAVIS_BUILD_DIR/wallet.bitshares.org
    git checkout gh-pages
    rm -rf ./*
    git checkout ./CNAME
    cp -Rv $TRAVIS_BUILD_DIR/build/hash-history/* .
    git add -A
    git commit -a -m "Update wallet by Travis: v$TRAVIS_TAG"
    git push
fi

if [[ "$unamestr" == 'Linux' && -n $TRAVIS_TAG && $TRAVIS_BRANCH =~ .+-rc[1-9]$ ]]
then
    ## staging.bitshares.org subdomain (independent repo)
    echo "Pushing new staging subdomain repo"
    git clone https://github.com:${GITHUB_TOKEN}@github.com/${STAGING_REPO} $TRAVIS_BUILD_DIR/staging.bitshares.org
    cd $TRAVIS_BUILD_DIR/staging.bitshares.org
    rm -rf ./*
    git checkout ./CNAME
    cp -Rv $TRAVIS_BUILD_DIR/build/hash-history/* .
    git add -A
    git commit -a -m "Update staging by Travis on new commit"
    git push
fi

if [ $unamestr = 'Linux' ] && [ $TRAVIS_BRANCH = 'develop' ] && [ -z $TRAVIS_PULL_REQUEST_BRANCH ]
then
    ## develop.bitshares.org subdomain (independent repo)
    echo "Pushing new develop subdomain repo"
    git clone https://github.com:${GITHUB_TOKEN}@github.com/${DEVELOP_REPO} $TRAVIS_BUILD_DIR/develop.bitshares.org
    cd $TRAVIS_BUILD_DIR/develop.bitshares.org
    rm -rf ./*
    git checkout ./CNAME
    cp -Rv $TRAVIS_BUILD_DIR/build/hash-history/* .
    git add -A
    git commit -a -m "Update develop by Travis on new commit"
    git push
fi
