Contributing
============

Graphene-UI is open source and anyone is free to contribute. PR's are welcomed and will be reviewed in a timely manner, and long-term contributors will be given access to the repo.

If you would like to get involved, we have a Slack channel where you can ask questions and get help.

Development process
-------------------

- Bugs are always worked before enhancements
- Developers should work each issue according to a numbered branch corresponding to the issue using ``git checkout -b 123``

Github issues are being used to track bugs and feature requests. 

- Project Coordinator (@wmbutler) reads through new issues and requests clarification if needed
- Issues get assigned to Milestones
- Milestones are typically 1 week long ending on Wednesday
- All devs are expected to install `Zenhub <https://zenhub.io>`_. Zenhub creates viewable pipelines and allows for issue estimation. Estimates are based on anticipated hours to complete.

Categorization of issues
~~~~~~~~~~~~~~~~~~~~~~~~

- **New issues** have not been categorized yet or are tagged as question when seeking clarification.
- **Backlog issues** have been assigned to a Milestone and are waiting for a dev to estimate and claim.
- **In Progress issues** are being actively worked on.
- **Testing issues** are waiting for independent tests. (Methodology fully defined as of yet, so devs test their own work for now)
- **Closed issues** are complete

Milestones
----------

- Project Coordinator announces the number of issues and requests them to be claimed and estimated
- Presents a burndown chart for the week

Sunday
~~~~~~

- Project Coordinator summarizes progress with burndown chart
- Ensures that all items are claimed and estimated
- Escalates to @valzav for unestimated and/or unclaimed items

Wednesday
~~~~~~~~~

- Testing is completed
- Release notes completed by @valzav
- Project Coordinator announces release on bitsharestalk and provides link to release notes

Thursday
~~~~~~~~

- Incomplete items are moved to new Milestone
- Old Milestone is closed
- New Milestone is activated (rinse lather repeat)

Coding style guideline
----------------------

Our style guideline is based on `Airbnb JavaScript Style Guide <https://github.com/airbnb/javascript>`_, with few exceptions:

- Strings are double quoted
- Additional trailing comma (in arrays and objects declaration) is optional
- 4 spaces tabs
- Spaces inside curly braces are optional

We strongly encourage to use _eslint_ to make sure the code adhere to our style guidelines.

To install eslint and its dependencies, run::

    npm install -g eslint-config-airbnb eslint-plugin-react eslint babel-eslint

Testing
-------

Jest currently doesn't work with node (see `<https://github.com/facebook/jest/issues/243>`_), so in order to run the tests you need to install iojs. Under Ubuntu instructions can be found here:

`Nodesource <https://nodesource.com/blog/nodejs-v012-iojs-and-the-nodesource-linux-repositories>`_ Ubuntu io.js installation.

In order for jest to correctly follow paths it is necessary to add a local path to your NODE_PATH variable. Under Ubuntu, you can do so by running the following from the web directory::

    export NODE_PATH=$NODE_PATH:.


Tests are then run using::

    npm test
