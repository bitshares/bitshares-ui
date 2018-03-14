cd $TRAVIS_BUILD_DIR
unamestr=`uname`
if [ "$unamestr" == 'Linux' ]
then
    npm run build-hash
fi
if [ $TRAVIS_TAG ]
then
    npm run-script package
fi
