cd $TRAVIS_BUILD_DIR
unamestr=`uname`
if [[ "$unamestr" == 'Linux' && -n $TRAVIS_TAG ]]
then
    # npm run build-github
    npm run build-hash
fi
if [ $TRAVIS_TAG ]
then
    npm run-script package
    sha256sum $TRAVIS_BUILD_DIR/build/binaries/* > $TRAVIS_BUILD_DIR/shasums_$TRAVIS_JOB_NUMBER.txt
fi
