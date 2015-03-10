"use strict";
var logger = require("../logger"),
    path = require("path"),
    fs = require("fs"),
    uuid = require("node-uuid"),
    _ = require("lodash");

var database = (function () {

    function Document(modelName, options) {
        this._options = options || {};
        this._name = modelName;

        this._cachedData = null;
    }

    Document.prototype.index = function (callback) {

        var name = this._name;
        logger.debug("[database]: index: about to retrieve items for type: " + name);

        callback = _callbackWrapper(callback);

        if (!this._cachedData) {
            _readFileContent(name, function (err, data) {

                if (err) {
                    logger.error("failed reading content for type: " + name, err);
                }
                else {
                    this._cachedData = data;
                }

                callback(err, data);
            }.bind(this));
        }
        else {
            callback(null, this._cachedData);
        }
    };

    Document.prototype.create = function (data, callback) {

        var name = this._name;
        logger.debug("[database]: create: about to create new item of type: " + name);

        var doCreate = function (err, storedItems) {

            if (err) {
                logger.error("[database]: create: failed to retrieve stored items");
                callback(err);
            }
            else {
                var newItem = _getTaskAttributes(data);
                newItem.id = uuid();

                _updateItemAndPersist.call(this, storedItems, newItem, function (err, item) {

                    if (!err) {
                        logger.debug("[database]: create: successfully created a new item for type: " + name);
                    }

                    callback(err, item);
                }, {create: true});
            }

        }.bind(this);

        _doCrudAction.call(this, doCreate);
    };

    Document.prototype.update = function (id, data, callback) {

        var name = this._name;
        logger.debug("[database]: update: about to update item of type: " + name + " with id: " + id);

        var doUpdate = function (err, storedItems) {

            if (err) {
                logger.error("[database]: update: failed to retrieve stored items");
                callback(err);
            }
            else {
                var updateItem = _getTaskAttributes(data);
                updateItem.id = id;

                _updateItemAndPersist.call(this, storedItems, updateItem, function (err, item) {

                    if (!err) {
                        logger.debug("[database]: update: successfully updated item for type: " + name);
                    }

                    callback(err, item);
                });
            }
        }.bind(this);

        _doCrudAction.call(this, doUpdate);
    };

    Document.prototype.remove = function (id, callback) {

        var name = this._name;
        logger.debug("[database]: remove: about to delete item of type: " + name + " with id: " + id);

        var doDelete = function (err, storedItems) {

            if (err) {
                logger.error("[database]: remove: failed to retrieve stored items");
                callback(err);
            }
            else {
                var deleteItem = {id: id};

                _updateItemAndPersist.call(this, storedItems, deleteItem, function (err, item) {

                    if (!err) {
                        logger.debug("[database]: remove: successfully deleted item for type: " + name);
                    }

                    callback(err, item);
                }, {remove: true});
            }
        }.bind(this);

        _doCrudAction.call(this, doDelete);
    };

    function _doCrudAction(doFn) {

        if (!this._cachedData) {
            this.index(doFn);
        }
        else {
            doFn(null, this._cachedData);
        }
    }

    function _updateItemAndPersist(items, actionItem, callback, options) {

        var changed = false;
        options = options || {};
        items = items || [];

        if (actionItem.id) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === actionItem.id) {
                    if (options.create) {
                        throw new Error("database - found existing item with same id. cant create it - " + actionItem.id);
                    }

                    if (options.remove) {
                        items.splice(i, 1);//remove the item from the array
                    }
                    else {
                        items.splice(i, 1, actionItem); //replace the item with the updated one
                    }

                    changed = true;
                    break;
                }
            }
        }

        if (!changed && options.create) {
            items.push(actionItem);    //add the new item
            changed = true;
        }

        if (changed) {
            _writeFileContent(this._name, items, function (err) {
                if (err) {
                    logger.error("[database]: _updateItemAndPersist: failed to save changes to disc", err);
                }

                callback(err, actionItem);
            });
        }
        else{
            callback("nothing was changed");
        }
    }

    function _getTaskAttributes(postedData) {

        return {
            title: postedData.title,
            completed: postedData.completed,
            created: postedData.created
        }
    }

    function _writeFileContent(name, data, callback) {

        var fileName = path.join(global.dataPath, name + ".json");
        var dataStr;

        logger.debug("[database]: _writeFileContent: about to write content to file: " + fileName);

        try {
            dataStr = JSON.stringify(data);
        }
        catch (ex) {
            logger.error("[database]: _writeFileContent: failed to stringify data! ", ex);
        }

        if (dataStr) {
            fs.writeFile(fileName, dataStr, {encoding: "UTF-8"}, function (err) {
                callback(err);
            });
        }
        else {
            callback("invalid data");
        }
    }

    function _readFileContent(name, callback) {

        var fileName = path.join(global.dataPath, name + ".json");

        fs.readFile(fileName, function (err, data) {

            var dataJson;

            if (!err) {

                try {
                    dataJson = JSON.parse(data);
                }
                catch (ex) {
                    err = ex;
                }
            }

            callback(err, dataJson);
        });
    }

    function _callbackWrapper(callback) {

        return function (err, res) {
            if (_.isFunction(callback)) {
                callback(err, res);
            }
        }
    }

    return {
        tasks: new Document("tasks")
    };
})();

module.exports = database;