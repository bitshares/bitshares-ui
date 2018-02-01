cd $TRAVIS_BUILD_DIR
unamestr=`uname`
if [[ "$unamestr" == 'Linux' && -n $TRAVIS_TAG ]]
then
    # npm run build-github
    npm run build-hash
fi
npm run-script package
