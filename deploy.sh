# This script clones an existing gh-pages repository and pushes updates
# from the newly compiled version into github.
# The GITHUB_TOKEN for authentication is stored in the encrypted
# variable in .travis.yml

# Clone Repo
############
#echo "Cloning wallet repo"
unamestr=`uname`
echo $unamestr
echo $TRAVIS_TAG
if [[ "$unamestr" == 'Linux' && -n $TRAVIS_TAG ]]
then
    git clone https://github.com:${GITHUB_TOKEN}@github.com/${WALLET_REPO} $TRAVIS_BUILD_DIR/wallet

    # Copy new compile files
    ########################
    #echo "Copying compiled files over to repo"
    #ls -al $TRAVIS_BUILD_DIR/web/dist/
    #ls -al /gh-pages/
    rm -rf $TRAVIS_BUILD_DIR/wallet/wallet/*
    cp -Rv $TRAVIS_BUILD_DIR/build/hash-history/* $TRAVIS_BUILD_DIR/wallet/wallet/

    # Commit Changes
    ################
    echo "Pushing new wallet repo"
    cd $TRAVIS_BUILD_DIR/wallet
    #git config user.email "travis@bitshares.org"
    #git config user.name "BitShares Wallet Build Automation"
    git add -A
    git commit -a -m "Update wallet by Travis: v$TRAVIS_TAG"

    # Push Changes
    ##############
    git push
fi
