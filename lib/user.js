(function () {
    "use strict";

    var __class = require("node-class").class,
        Events = require("node-class").Events,
        User;

    User = __class("User", {
        extends: ["Events"],

        session_id: null,
        connection: null,
        userdata: null,
        server_id: null, // set when joining
        __rooms: [],

        initialize: function (session_id, connection) {
            this.__parent();

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
        },

        "abstract load_userdata": function (callback) {
            //here you need to call the callback with true if it's a valid user, false otherwise
        },
        "abstract get_username": function () {
        },
        "abstract relay_message": function (message, callback) {
        },
        "abstract end_connection": function () {
        }
    });


    module.exports = User;

}(module));
