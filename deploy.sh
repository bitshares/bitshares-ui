# This script clones an existing gh-pages repository and pushes updates
# from the newly compiled version into github.
# The GITHUB_TOKEN for authentication is stored in the encrypted
# variable in .travis.yml

# Clone Repo
############
#echo "Cloning wallet repo"
#git clone -b gh-pages https://github.com:${GITHUB_TOKEN}@github.com/${GITHUB_REPO} /gh-pages

# Copy new compile files
########################
#echo "Copying compiled files over to repo"
#ls -al $TRAVIS_BUILD_DIR/web/dist/
#ls -al /gh-pages/
#cp -Rv $TRAVIS_BUILD_DIR/web/dist/* /gh-pages/

# Commit Changes
################
#echo "Pushing new wallet repo"
#cd /gh-pages
#git config user.email "travis@bitshares.org"
#git config user.name "BitShares Wallet Build Automation"
#git add .
#git commit -a -m "Travis #$TRAVIS_BUILD_NUMBER"

# Push Changes
##############
#git push origin gh-pages
