var logger = require("../../logger"),
    consts = require("../../consts"),
    METHODS = consts.HTTP_METHODS,
    database = require("../../storage/database");

var tasksHandler = (function () {

    function handleGetTasks(resource, data, metadata, method, pathData, session, publish) {

        logger.debug("[tasksHandler]: handleGetTasks: incoming request for tasks");

        database.tasks.index(function (err, data) {

            if (err) {
                logger.error("[tasksHandler]: handleGetTasks: failed to retrieve tasks data ", err);
            }

            data = data || [];

            publish(data);
        });
    }

    function handleCreateTask(resource, data, metadata, method, pathData, session, publish) {

        database.tasks.create(data, function (err, newTask) {

            var response;

            if (err) {
                logger.error("[tasksHandler]: handleCreateTask: failed to create a new task");
                response = "save failed";
            }
            else {
                response = newTask;
            }

            publish(response, !!err);
        });
    }

    function handleUpdateTask(resource, data, metadata, method, pathData, session, publish) {

        var id = pathData.keys.id;

        if (id) {
            logger.debug("[tasksHandler]: handleUpdateTask: received request to update task with id: " + id);

            database.tasks.update(id, data, function (err, updatedTask) {

                var response;

                if (err) {
                    logger.error("[tasksHandler]: handleUpdateTask: failed to update task");
                    response = "update failed";
                }
                else {
                    response = updatedTask;
                }

                publish(response, !!err);
            });
        }
        else {
            publish({"message": "id must be provided for update"}, true);
        }
    }

    function handleDeleteTask(resource, data, metadata, method, pathData, session, publish) {
        var id = pathData.keys.id;

        if (id) {
            logger.debug("[tasksHandler]: handleUpdateTask: received request to delete task with id: " + id);

            database.tasks.remove(id, function(err, deletedTask){

                var response;

                if (err) {
                    logger.error("[tasksHandler]: handleDeleteTask: failed to delete task");
                    response = "delete failed";
                }
                else {
                    response = deletedTask;
                }

                publish(response, !!err);

            });
        }
        else{
            publish({"message": "id must be provided for delete"}, true);
        }
    }

    return {
        map: function () {
            return {
                "/tasks": handleGetTasks,                   //GET  (default verb)
                "<POST>/tasks": handleCreateTask,           //POST (verb can be defined as part of the resource URL)
                "/tasks/:id": {                             //PUT  (verb can be defined using the method property)
                    method: METHODS.PUT,
                    handler: handleUpdateTask
                },
                "<DELETE>/tasks/:id":handleDeleteTask       //DELETE
            };
        }
    };
})();

module.exports = tasksHandler;