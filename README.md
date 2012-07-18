logger [<img src="https://secure.travis-ci.org/jolira/logger.png" />](http://travis-ci.org/#!/jolira/logger)
========

Writes structured log messages to S3 (if credentials are provided) or to standard out.

```javascript
var jolira = require('jolira-logger'),
    logger = jolira({
        "aws-account-id":"8999-7199-8899",
        "aws-access-key-id":"0FL2BˆCEW5XED0TXXJG2",
        "aws-secret-access-key":"aP14UHZLYyMRx99QiXMonHHmU2kDBabHgZWnFZ06",
        "aws-region":'us-west-1',
        "aws-bucket":"jolira-logging",
        "measure-interval": 10000,
        "application-name":"test"
    });

    logger.info("anything will be logged", [ { a: true }, "hello world" ], "blahh!");
    logger.warning("warnings are available");
    logger.warn("warns as well");
    logger.err("errs creates messages with level 'error'");
    logger.error("error creates message with level 'error' as well");
    logger.debug("debug statement are supported");
    logger.notice("notices are always nice");
    logger.severe("severe conditions may happen");
    logger.emergency("emergencies as well");
    logger.critical("critical log entries, as all other, also take an arbitrary number of parameters",
        [ { a: true }, "hello world" ], "blahh!");

    logger("my-level", "one can also define new log level,", "such a 'my-level' in this example");
```

Supported options are (all of them are optional):

* ``aws-account-id``: The id of the amazon account to be used.
* ``aws-access-key-id``: The amazon access key id.
* ``aws-secret-access-key``: The amazon access key id.
* ``aws-region``: The amazon region to be used. Acceptable values are ``'us-east-1'``, ``'us-west-1'``, ``'us-west-2'``,
                  ``'eu-west-1'``, ``'ap-southeast-1'``, ``'ap-northeast-1'``, ``'sa-east-1'``, and ``'us-gov-west-1'``.
* ``aws-bucket``: The name of the bucket to be used.
* ``hostname``: Can be used to specify a hostname. If omitted, ``os.hostname()`` will be used.
* ``measure-interval``:  Specifies if and how often information about the OS and the node process should be logged. If
                         omitted this information will not be logged. Specify an interval time in milliseconds.
* ``application-name``: The application name to be used. If omitted, ugly file-names may be created.
