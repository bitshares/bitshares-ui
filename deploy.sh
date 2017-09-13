# This script clones an existing gh-pages repository and pushes updates
# from the newly compiled version into github.
# The GITHUB_TOKEN for authentication is stored in the encrypted
# variable in .travis.yml

# Clone Repo
############
#echo "Cloning wallet repo"
unamestr=`uname`
if [[ "$unamestr" == 'Linux' ]]; then
    git clone https://github.com:${GITHUB_TOKEN}@github.com/${WALLET_REPO} /wallet

    # Copy new compile files
    ########################
    #echo "Copying compiled files over to repo"
    #ls -al $TRAVIS_BUILD_DIR/web/dist/
    #ls -al /gh-pages/
    rm -rf /wallet/wallet/*
    cp -Rv $TRAVIS_BUILD_DIR/build/hash-history/* /wallet/wallet/

    # Commit Changes
    ################
    echo "Pushing new wallet repo"
    cd /wallet
    #git config user.email "travis@bitshares.org"
    #git config user.name "BitShares Wallet Build Automation"
    git add -A
    git commit -a -m "Travis #$TRAVIS_BUILD_NUMBER"

    # Push Changes
    ##############
    git push
fi
