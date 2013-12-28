(function () {
    "use strict";

    var Class = require("node-class").Class,
        Events = require("node-class").Events,
        User;

    User = new Class("User", {
        session_id: null,
        connection: null,
        userdata: null,
        server_id: null, // set when joining
        __rooms: []

    });

    User.Extends(Events);

    User.Implements({
        __construct: function (session_id, connection) {
            this.parent();

            this.session_id = session_id;
            this.connection = connection;
        },
        addRoom: function (room_id) {
            this.__rooms.push(room_id);
        },
        setServer: function(server_id) {
            this.server_id = server_id;
        },
        removeRoom: function (room_id) {
            var idx;
            if ((idx = this.__rooms.indexOf(room_id)) !== -1) {
                this.__rooms.splice(idx, 1);
                return true;
            }
            return false;
        },
        rooms: function () {
            return this.__rooms;
        }
    });

    User.Abstract({
        load_userdata: function (callback) {
            //here you need to call the callback with true if it's a valid user, false otherwise
        },
        get_username: function () {
        },
        relay_message: function (message, callback) {
        },
        end_connection: function () {
        }
    });


    module.exports = User;

}(module));
