/*jslint white: true, forin: false, node: true, indent: 4 */
(function (module) {
    "use strict";

    /*
     * for this test to be successful, you will have to have a configuration file set up
     * containing valid logger entries, such as:
     * {
     *   "aws-access-key-id" : "0FL2BˆCEW5XED0T3VJG2",
     *   "aws-secret-access-key" : "aP14UHZLYyMRx99QiMXnoGAmU2kDBabHgZWnFZ06",
     *   "aws-account-id" : "8913-7199-8811",
     *   "aws-bucket" : "hubz",
     *   "aws-region": "us-west-1"
     * }
     */
    var now = Date.now(),
        loader = require('server-config'),
        assert = require('assert'),
        vows = require('vows'),
        logger = require('../lib/logger'),
        createTest = {
            "topic":function (config) {
                return logger(config);
            },
            "log a notice":logTest("notice"),
            "log a debug message":logTest("debug"),
            "log an info message":logTest("info"),
            "log a severe message":logTest("severe"),
            "log a critical message":logTest("critical"),
            "log a crit message":logTest("crit"),
            "log a err message":logTest("err"),
            "log a emergency message":logTest("emergency"),
            "log an error":logTest("error")
        };

    function logTest(type) {
        return {
            "topic":function (logger) {
                logger[type]("test-" + type + now);
                this.callback();
            },
            "verify the result":function (err) {
                if (err) {
                    throw err;
                }
            }
        };
    }

    // Create a Test Suite
    vows.describe('logger').addBatch({
        'load the configuration':{
            topic:function () {
                loader("~/.hubz.json", this.callback);
            },
            'create the logger object':createTest
        }
    }).export(module);
})(module);
