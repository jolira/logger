/*jslint node: true, vars: true, indent: 4 */
(function (module) {
    "use strict";

    var SUBMIT_INTERVAL = 1001,
        MEASURE_INTERVAL = 10000,
        console_error = console.error, // save it, incase somebody changes it.
        console_log = console.log, // save it, incase somebody changes it.
        os = require('os'),
        util = require('util'),
        awssum = require('awssum'),
        amazon = awssum.load('amazon/amazon'),
        S3 = awssum.load('amazon/s3').S3,
        lastMeasurementTime = 0,
        pending;

    function stringify(data) {
        try {
            return JSON.stringify(data);
        }
        catch(e) {
            return "<<<circular>>>";
        }
    }

    function connect(properties) {
        var accessKeyId = properties["aws-access-key-id"],
            secretAccessKey = properties['aws-secret-access-key'],
            awsAccountId = properties['aws-account-id'],
            region = properties['aws-region'] || amazon.US_WEST_1;

        if (!accessKeyId || !secretAccessKey) {
            return undefined;
        }

        return new S3({
            accessKeyId:accessKeyId,
            secretAccessKey:secretAccessKey,
            awsAccountId:awsAccountId,
            region:region
        });
    }

    function getFilePrefix(date) {
        var year = date.getUTCFullYear(),
            month = date.getUTCMonth() + 1,
            day = date.getUTCDate(),
            hour = date.getUTCHours(),
            minutes = date.getUTCMinutes(),
            seconds = date.getUTCSeconds();

        return year + "/" + month + "/" + day + "/" + hour + "/" + minutes + "/" + seconds + "/";
    }

    function formatMessage() {
        var args = Array.prototype.slice.call(arguments),
            first = args.shift();

        args.unshift(new Date());
        args.unshift('[%s] ' + first);

        return util.format.apply(null, args);
    }

    function add(hidden, content, level) {
        var now = Date.now();

        if (!hidden.s3) {
            if (level === 'info' || level === 'debug' || level === 'notice') {
                return console_log(level, formatMessage.apply(this, content));
            }

            return console_error(level, formatMessage.apply(this, content));
        }

        if (!pending) {
            setTimeout(function () {
                var now = new Date(),
                    prefix = getFilePrefix(now),
                    filename = prefix + hidden.hostname + "/" + hidden.name + '-' + process.pid + '.log',
                    _data = {
                        ms:pending
                    },
                    _now = Date.now();

                if (hidden.interval && _now > lastMeasurementTime + hidden.interval) {
                    _data.ts = _now;
                    _data.os = {
                        load:os.loadavg(),
                        free:os.freemem()
                    };
                    _data.process = {
                        used:process.memoryUsage(),
                        uptime:process.uptime()
                    };

                    if (lastMeasurementTime === 0) {
                        _data.os.cpus = os.cpus();
                        _data.os.type = os.type();
                        _data.os.arch = os.arch();
                        _data.os.cpus = os.uptime();
                        _data.os.release = os.release();
                        _data.os.platform = os.platform();
                        _data.os.totalmem = os.totalmem();
                        _data.os.networkInterfaces = os.networkInterfaces();
                        _data.process.versions = process.versions;
                        _data.process.config = process.config;
                        _data.process.title = process.title;
                        _data.process.uid = process.getuid && process.getuid();
                        _data.process.gid = process.getgid && process.getgid();
                        _data.process.env = process.env;
                        _data.process.cwd = process.cwd();
                        _data.process.argv = process.argv;
                    }

                    lastMeasurementTime = _now;
                }

                var data = stringify(_data);

                pending = undefined;

                return hidden.s3.PutObject({
                    BucketName:hidden.bucket,
                    ObjectName:filename,
                    ContentLength:data.length,
                    ContentType:"application/json",
                    StorageClass:"REDUCED_REDUNDANCY",
                    Body:data
                }, function (err) {
                    if (err) {
                        console_error("logging error", err);
                    }
                });

            }, SUBMIT_INTERVAL);
            pending = [];
        }

        return pending.push({
            ts:now,
            lv:level,
            ct:content
        });
    }

    module.exports = function (props) {
        var properties = props || {},
            hostname = properties.hostname || os.hostname(),
            hidden = {
                s3:connect(properties),
                hostname:encodeURIComponent(hostname),
                bucket:properties['aws-bucket'],
                name: encodeURIComponent(properties['application-name'] || process.argv[1]),
                interval: properties['measure-interval'] || MEASURE_INTERVAL
            },
            logger = function (level) {
                var args = Array.prototype.slice.call(arguments, 1);

                return add(hidden, args, level);
            };

        function log(level) {
            return function () {
                var args = Array.prototype.slice.call(arguments);

                add(hidden, args, level);
            };
        }

        logger.info = log("info");
        logger.debug = log("debug");
        logger.notice = log("notice");
        logger.severe = log("severe");
        logger.alert = log("alert");
        logger.error = logger.err = log("error");
        logger.warning = logger.warn = log("warning");
        logger.emergency = logger.emerg = log("emergency");
        logger.critical = logger.crit = log("critical");

        return logger;
    };
})
    (module);