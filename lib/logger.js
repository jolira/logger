/*jslint node: true, vars: true, indent: 4 */
(function (module) {
    "use strict";

    var SUBMIT_INTERVAL = 1001,
        console_error = console.error, // save it, incase somebody changes it.
        os = require('os'),
        awssum = require('awssum'),
        amazon = awssum.load('amazon/amazon'),
        S3 = awssum.load('amazon/s3').S3,
        pending;

    function connect(properties) {
        var accessKeyId = properties["aws-access-key-id"],
            secretAccessKey = properties['aws-secret-access-key'],
            awsAccountId = properties['aws-account-id'],
            region = properties['aws-region'] || amazon.US_WEST_1;

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

    function add(hidden, content, level, cb) {
        if (!pending) {
            setTimeout(function () {
                var now = new Date(),
                    data = JSON.stringify(pending),
                    prefix = getFilePrefix(now),
                    filename = prefix + hidden.hostname + '.log';

                pending = undefined;

                return hidden.s3.PutObject({
                    BucketName:hidden.bucket,
                    ObjectName:filename,
                    ContentLength:data.length,
                    Body:data
                }, cb);

            }, SUBMIT_INTERVAL);
            pending = [];
        }

        pending.push({
            ts:Date.now(),
            level:level,
            content:content
        });
    }

    function log(type) {
        return function () {
            var args = Array.prototype.slice.call(arguments);

            return add(hidden, args, type, function (err) {
                if (err) {
                    console_error("logging error", err);
                }
            });
        };
    }

    module.exports = function (properties) {
        var hostname = properties.hostname || os.hostname(),
            hidden = {
                s3:connect(properties),
                hostname:encodeURIComponent(hostname),
                bucket:properties['aws-bucket']
            };

        return {
            log:log("log"),
            error:log("error"),
            info:log("info"),
            debug:log("debug"),
            severe:log("severe"),
            warn:log("warning"),
            warning:log("warning"),
            critical:log("critical")
        };
    };
})(module);